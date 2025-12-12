package com.we.hirehub.service.ai;

import com.we.hirehub.dto.aiMapper.JobMatchingHistoryDto;
import com.we.hirehub.dto.aiMapper.SaveJobMatchingRequest;
import com.we.hirehub.entity.Company;
import com.we.hirehub.entity.JobPosts;
import com.we.hirehub.entity.Matching;
import com.we.hirehub.entity.Resume;
import com.we.hirehub.entity.Users;
import com.we.hirehub.repository.JobPostsRepository;
import com.we.hirehub.repository.MatchingRepository;
import com.we.hirehub.repository.ResumeRepository;
import com.we.hirehub.repository.UsersRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class JobMatchingHistoryService {

  private final MatchingRepository matchingRepository;
  private final UsersRepository usersRepository;
  private final ResumeRepository resumeRepository;
  private final JobPostsRepository jobPostsRepository;

  @Transactional
  public JobMatchingHistoryDto saveHistory(String email, SaveJobMatchingRequest request) {
    Users user = usersRepository.findByEmail(email)
        .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));

    Resume resume = resumeRepository.findById(request.getResumeId())
        .orElseThrow(() -> new RuntimeException("이력서를 찾을 수 없습니다."));

    if (!resume.getUsers().getId().equals(user.getId())) {
      throw new RuntimeException("본인의 이력서만 사용할 수 있습니다.");
    }

    List<Matching> savedMatches = new ArrayList<>();

    for (SaveJobMatchingRequest.MatchResultDto result : request.getMatchResults()) {
      if (result.getJobId() == null) {
        continue; // DB에 없는 공고는 저장 불가 (Entity 제약)
      }

      JobPosts jobPost = jobPostsRepository.findById(result.getJobId())
          .orElse(null);

      if (jobPost == null) {
        continue;
      }

      Company company = jobPost.getCompany();

      Matching matching = Matching.builder()
          .resume(resume)
          .jobPosts(jobPost)
          .company(company)
          .ranking(result.getGrade() + " (" + result.getScore() + ")")
          .reason(result.getReasons() != null ? String.join("\n", result.getReasons()) : "") // 이유 저장
          .build();

      savedMatches.add(matchingRepository.save(matching));
    }

    if (savedMatches.isEmpty()) {
      throw new RuntimeException("저장할 수 있는 유효한 매칭 결과가 없습니다.");
    }

    // 첫 번째 매칭의 ID를 대표 ID로 사용
    Long representativeId = savedMatches.get(0).getId();

    // 실제로 저장된 결과만 반환
    List<SaveJobMatchingRequest.MatchResultDto> savedResults = savedMatches.stream()
        .map(m -> {
          String ranking = m.getRanking(); // "S (95)"
          String grade = "B";
          int score = 0;
          try {
            grade = ranking.split(" \\(")[0];
            score = Integer.parseInt(ranking.split(" \\(")[1].replace(")", ""));
          } catch (Exception e) {
            grade = ranking;
          }

          List<String> reasons = new ArrayList<>();
          if (m.getReason() != null && !m.getReason().isEmpty()) {
            reasons = List.of(m.getReason().split("\n"));
          }

          return SaveJobMatchingRequest.MatchResultDto.builder()
              .jobId(m.getJobPosts().getId())
              .companyId(m.getCompany().getId())
              .jobTitle(m.getJobPosts().getTitle())
              .companyName(m.getCompany().getName())
              .grade(grade)
              .score(score)
              .reasons(reasons)
              .build();
        })
        .collect(Collectors.toList());

    return JobMatchingHistoryDto.builder()
        .id(representativeId)
        .resumeId(resume.getId())
        .resumeTitle(resume.getTitle())
        .matchResults(savedResults) // 실제로 저장된 결과만 반환
        .createdAt(LocalDateTime.now())
        .build();
  }

  @Transactional(readOnly = true)
  public List<JobMatchingHistoryDto> getHistoryList(String email) {
    Users user = usersRepository.findByEmail(email)
        .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));

    // 사용자의 모든 이력서에 대한 매칭 기록 조회
    // Matching 엔티티에는 User 필드가 없으므로, Resume를 통해 간접 조회해야 함
    // 하지만 성능상 Resume를 먼저 다 찾고 Matching을 찾는 건 비효율적일 수 있음.
    // 여기서는 간단히 구현: 사용자의 모든 Resume ID를 찾아서 Matching 조회
    // 또는 MatchingRepository에 findByResumeIn(...) 추가 필요.
    // 일단 간단하게: 사용자의 최근 이력서 5개에 대해서만 조회하거나...
    // 아니면 MatchingRepository에 @Query로 조인해서 가져오는 게 좋음.
    // 여기서는 MatchingRepository에 findByResume을 사용하여 반복 조회 (데이터가 많지 않다고 가정)

    List<Resume> resumes = resumeRepository.findByUsers(user);
    List<Matching> allMatches = new ArrayList<>();

    for (Resume resume : resumes) {
      allMatches.addAll(matchingRepository.findByResumeOrderByIdDesc(resume));
    }

    // ID 역순 정렬
    allMatches.sort((a, b) -> Long.compare(b.getId(), a.getId()));

    // 세션 그룹핑 (ID 차이 10 이내)
    Map<Long, List<Matching>> groupedBySession = new LinkedHashMap<>();
    Long currentSessionId = null;

    for (Matching match : allMatches) {
      if (currentSessionId == null || Math.abs(match.getId() - currentSessionId) > 10) {
        currentSessionId = match.getId();
      }
      groupedBySession.computeIfAbsent(currentSessionId, k -> new ArrayList<>()).add(match);
    }

    return groupedBySession.values().stream()
        .map(this::convertToHistoryDto)
        .collect(Collectors.toList());
  }

  @Transactional(readOnly = true)
  public JobMatchingHistoryDto getHistoryDetail(String email, Long matchingId) {
    Matching matching = matchingRepository.findById(matchingId)
        .orElseThrow(() -> new RuntimeException("기록을 찾을 수 없습니다."));

    // 권한 체크
    if (!matching.getResume().getUsers().getEmail().equals(email)) {
      throw new RuntimeException("접근 권한이 없습니다.");
    }

    // 같은 세션 찾기
    List<Matching> sessionMatches = matchingRepository.findByResume(matching.getResume()).stream()
        .filter(m -> Math.abs(m.getId() - matchingId) <= 10)
        .collect(Collectors.toList());

    return convertToHistoryDto(sessionMatches);
  }

  @Transactional
  public void deleteHistory(String email, Long matchingId) {
    Matching matching = matchingRepository.findById(matchingId)
        .orElseThrow(() -> new RuntimeException("기록을 찾을 수 없습니다."));

    if (!matching.getResume().getUsers().getEmail().equals(email)) {
      throw new RuntimeException("접근 권한이 없습니다.");
    }

    List<Matching> sessionMatches = matchingRepository.findByResume(matching.getResume()).stream()
        .filter(m -> Math.abs(m.getId() - matchingId) <= 10)
        .collect(Collectors.toList());

    matchingRepository.deleteAll(sessionMatches);
  }

  private JobMatchingHistoryDto convertToHistoryDto(List<Matching> matches) {
    if (matches.isEmpty())
      return null;

    Matching first = matches.get(0);

    List<SaveJobMatchingRequest.MatchResultDto> results = matches.stream()
        .map(m -> {
          String ranking = m.getRanking(); // "S (95)"
          String grade = "B";
          int score = 0;
          try {
            grade = ranking.split(" \\(")[0];
            score = Integer.parseInt(ranking.split(" \\(")[1].replace(")", ""));
          } catch (Exception e) {
            grade = ranking;
          }

          // 이유 복원
          List<String> reasons = new ArrayList<>();
          if (m.getReason() != null && !m.getReason().isEmpty()) {
            reasons = List.of(m.getReason().split("\n"));
          }

          return SaveJobMatchingRequest.MatchResultDto.builder()
              .jobId(m.getJobPosts().getId())
              .companyId(m.getCompany().getId())
              .jobTitle(m.getJobPosts().getTitle())
              .companyName(m.getCompany().getName())
              .grade(grade)
              .score(score)
              .reasons(reasons) // ✅ 복원된 이유 설정
              .build();
        })
        .collect(Collectors.toList());

    return JobMatchingHistoryDto.builder()
        .id(first.getId())
        .resumeId(first.getResume().getId())
        .resumeTitle(first.getResume().getTitle())
        .matchResults(results)
        .createdAt(LocalDateTime.now()) // 실제 생성일은 Entity에 없어서 현재 시간... (Entity 수정 불가 제약)
        .build();
  }
}
