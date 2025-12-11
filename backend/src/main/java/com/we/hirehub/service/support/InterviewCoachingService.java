package com.we.hirehub.service.support;

import com.we.hirehub.dto.aiMapper.InterviewCoachingHistoryDto;
import com.we.hirehub.dto.aiMapper.InterviewSessionDto;
import com.we.hirehub.dto.aiMapper.SaveInterviewCoachingRequest;
import com.we.hirehub.entity.Coach;
import com.we.hirehub.entity.Resume;
import com.we.hirehub.entity.Users;
import com.we.hirehub.repository.CoachRepository;
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
public class InterviewCoachingService {

  private final CoachRepository coachRepository;
  private final UsersRepository usersRepository;
  private final ResumeRepository resumeRepository;

  @Transactional
  public InterviewCoachingHistoryDto saveHistory(String email, SaveInterviewCoachingRequest request) {
    // ✅ 이메일로 사용자 조회
    Users user = usersRepository.findByEmail(email)
        .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));

    Resume resume = resumeRepository.findById(request.getResumeId())
        .orElseThrow(() -> new RuntimeException("이력서를 찾을 수 없습니다."));

    List<Coach> savedCoaches = new ArrayList<>();

    // 각 세션을 Coach로 저장
    for (InterviewSessionDto session : request.getSessions()) {
      // 이모지 제거 (DB 인코딩 문제 방지)
      String safeQuestion = removeEmojis(session.getQuestion());
      String safeAnswer = removeEmojis(session.getAnswer());
      String safeFeedback = removeEmojis(session.getFeedback());

      Coach coach = Coach.builder()
          .user(user)
          .resume(resume)
          .jobPosts(null)
          .company(null)
          .question(safeQuestion)
          .answer(safeAnswer)
          .feedback(safeFeedback)
          .role("AGENT")
          .jobPostLink(request.getJobPostLink())
          .companyLink(request.getCompanyLink())
          .build();

      savedCoaches.add(coachRepository.save(coach));
    }

    Coach firstCoach = savedCoaches.get(0);

    return InterviewCoachingHistoryDto.builder()
        .id(firstCoach.getId())
        .resumeId(resume.getId())
        .resumeTitle(request.getResumeTitle())
        .jobPostLink(request.getJobPostLink())
        .companyLink(request.getCompanyLink())
        .sessions(request.getSessions())
        .createdAt(LocalDateTime.now())
        .build();
  }

  @Transactional(readOnly = true)
  public List<InterviewCoachingHistoryDto> getHistoryList(String email) {
    Users user = usersRepository.findByEmail(email)
        .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));

    List<Coach> coaches = coachRepository.findByUserOrderByIdAsc(user);

    // Resume ID와 ID 간격을 기준으로 그룹핑
    Map<String, List<Coach>> groupedBySession = new LinkedHashMap<>();

    Long currentSessionId = null;
    Long currentResumeId = null;

    for (Coach coach : coaches) {
      Long coachResumeId = coach.getResume().getId();

      // Resume ID가 다르거나, ID 간격이 10보다 크면 새로운 세션
      if (currentSessionId == null ||
          !coachResumeId.equals(currentResumeId) ||
          Math.abs(currentSessionId - coach.getId()) > 10) {
        currentSessionId = coach.getId();
        currentResumeId = coachResumeId;
      }

      String sessionKey = currentResumeId + "_" + currentSessionId;
      groupedBySession.computeIfAbsent(sessionKey, k -> new ArrayList<>()).add(coach);
    }

    return groupedBySession.values().stream()
        .map(this::convertToHistoryDto)
        .collect(Collectors.toList());
  }

  @Transactional(readOnly = true)
  public InterviewCoachingHistoryDto getHistoryDetail(String email, Long coachId) {
    Users user = usersRepository.findByEmail(email)
        .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));

    Coach coach = coachRepository.findById(coachId)
        .orElseThrow(() -> new RuntimeException("이력을 찾을 수 없습니다."));

    if (!coach.getUser().getId().equals(user.getId())) {
      throw new RuntimeException("접근 권한이 없습니다.");
    }

    // 같은 세션의 Coach들 찾기 (ID 기준 ±10 이내)
    List<Coach> allCoaches = coachRepository.findByUserOrderByIdDesc(coach.getUser());
    List<Coach> sessionCoaches = allCoaches.stream()
        .filter(c -> Math.abs(c.getId() - coach.getId()) <= 10)
        .sorted((a, b) -> Long.compare(a.getId(), b.getId()))
        .collect(Collectors.toList());

    return convertToHistoryDto(sessionCoaches);
  }

  @Transactional
  public void deleteHistory(String email, Long coachId) {
    Users user = usersRepository.findByEmail(email)
        .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));

    Coach coach = coachRepository.findById(coachId)
        .orElseThrow(() -> new RuntimeException("이력을 찾을 수 없습니다."));

    if (!coach.getUser().getId().equals(user.getId())) {
      throw new RuntimeException("접근 권한이 없습니다.");
    }

    // 같은 세션의 Coach들 모두 삭제
    List<Coach> allCoaches = coachRepository.findByUserOrderByIdDesc(coach.getUser());
    List<Coach> sessionCoaches = allCoaches.stream()
        .filter(c -> Math.abs(c.getId() - coach.getId()) <= 10)
        .collect(Collectors.toList());

    coachRepository.deleteAll(sessionCoaches);
  }

  private InterviewCoachingHistoryDto convertToHistoryDto(List<Coach> coaches) {
    if (coaches.isEmpty()) {
      throw new RuntimeException("코칭 기록이 없습니다.");
    }

    Coach firstCoach = coaches.get(0);

    // 링크가 있는 coach 찾기
    Coach coachWithLinks = coaches.stream()
        .filter(c -> c.getJobPostLink() != null || c.getCompanyLink() != null)
        .findFirst()
        .orElse(firstCoach);

    List<InterviewSessionDto> sessions = coaches.stream()
        .map(coach -> InterviewSessionDto.builder()
            .question(coach.getQuestion())
            .category(extractCategory(coach.getQuestion()))
            .answer(coach.getAnswer())
            .feedback(coach.getFeedback())
            .build())
        .collect(Collectors.toList());

    return InterviewCoachingHistoryDto.builder()
        .id(firstCoach.getId())
        .resumeId(firstCoach.getResume().getId())
        .resumeTitle(firstCoach.getResume().getTitle())
        .jobPostLink(coachWithLinks.getJobPostLink())
        .companyLink(coachWithLinks.getCompanyLink())
        .sessions(sessions)
        .createdAt(LocalDateTime.now())
        .build();
  }

  private String extractCategory(String question) {
    if (question == null)
      return "기타";

    if (question.contains("경험") || question.contains("프로젝트")) {
      return "경험";
    } else if (question.contains("기술") || question.contains("스킬")) {
      return "기술";
    } else if (question.contains("지원") || question.contains("동기")) {
      return "지원동기";
    } else if (question.contains("기업") || question.contains("회사")) {
      return "기업이해도";
    } else if (question.contains("강점") || question.contains("약점")) {
      return "인성";
    }
    return "기타";
  }

  // 이모지 제거 유틸리티
  private String removeEmojis(String text) {
    if (text == null)
      return "";
    // 4바이트 문자(이모지 등) 제거 정규식
    return text.replaceAll("[\\x{10000}-\\x{10FFFF}]", "");
  }
}
