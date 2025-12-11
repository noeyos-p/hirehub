package com.we.hirehub.service.support;

import com.we.hirehub.dto.support.JobPostsDto;
import com.we.hirehub.entity.JobPosts;
import com.we.hirehub.entity.Users;
import com.we.hirehub.repository.JobPostsRepository;
import com.we.hirehub.repository.UsersRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

/**
 * 🔥 AI 추천 공고 서비스
 * 유저 프로필(학력, 경력, 직무, 위치)과 공고 정보를 비교해 맞춤 추천
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class JobPostRecommendationService {

  private final JobPostsRepository jobPostsRepository;
  private final UsersRepository usersRepository;

  @Transactional(readOnly = true)
  public List<JobPostsDto> getRecommendedJobs(Long userId) {
    Users user = usersRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));

    log.info("🤖 추천 공고 조회중 - userId {}, profile: {}, {}, {}, {}",
            userId, user.getEducation(), user.getCareerLevel(),
            user.getPosition(), user.getLocation()
    );

    List<JobPosts> allJobs = jobPostsRepository.findAllWithTechStacks();

    if (allJobs.isEmpty()) {
      log.warn("⚠ 공고 없음");
      return List.of();
    }

    // 유저 프로필 정보 일부만 있어도 추천 작동하도록
    boolean hasAnyProfile =
            !isBlank(user.getEducation()) ||
                    !isBlank(user.getCareerLevel()) ||
                    !isBlank(user.getPosition()) ||
                    !isBlank(user.getLocation());

    if (!hasAnyProfile) {
      log.info("⚠ 프로필 비어있음 => 조회수 기준 fallback");
      return getPopularJobs();
    }

    List<JobPostsDto> recommended = allJobs.stream()
            .map(job -> {
              double score = calculateMatchScore(user, job);
              JobPostsDto dto = JobPostsDto.toDto(job);
              dto.setRecommendScore(score);
              return dto;
            })
            .sorted(
                    Comparator.comparingDouble(JobPostsDto::getRecommendScore).reversed()
                            .thenComparing((JobPostsDto dto) -> dto.getViews() != null ? dto.getViews() : 0L)
                            .reversed()
            )
            .limit(15)
            .collect(Collectors.toList());

    log.info("🎯 추천 {}개 반환 / 최고점 {}", recommended.size(),
            recommended.isEmpty() ? 0 : recommended.get(0).getRecommendScore());

    return recommended;
  }

  /** 인기 공고 fallback */
  private List<JobPostsDto> getPopularJobs() {
    return jobPostsRepository.findAllWithTechStacks().stream()
            .sorted(Comparator.comparingLong(JobPosts::getViews).reversed())
            .limit(15)
            .map(JobPostsDto::toDto)
            .collect(Collectors.toList());
  }

  private boolean isBlank(String str) {
    return str == null || str.trim().isEmpty();
  }

  /**
   * 💡 개선된 매칭 점수 계산 (100점 + 조회수 가중 포함)
   * - 직무 유사도: 최대 35점 (유사도 기반)
   * - 학력 매칭: 최대 20점
   * - 경력 매칭: 최대 20점
   * - 위치 매칭: 최대 15점
   * - 조회수 보정점수: 최대 10점 (AI 추천은 AI추천 느낌 유지)
   */
  private double calculateMatchScore(Users user, JobPosts job) {
    double score = 0;

    // 직무 유사도
    score += positionSimilarity(user.getPosition(), job.getPosition()) * 35;

    // 학력
    if (matchesEducation(user.getEducation(), job.getEducation())) {
      score += 20;
    }

    // 경력
    if (matchesCareerLevel(user.getCareerLevel(), job.getCareerLevel())) {
      score += 20;
    }

    // 위치 (부분 일치)
    if (matchesField(user.getLocation(), job.getLocation())) {
      score += 15;
    }

    // 조회수 가중치 (0~10점)
    if (job.getViews() != null) {
      score += Math.min(job.getViews() / 300.0, 10); // 조회수 300 = +1점
    }

    return score;
  }

  /** 문자열 부분일치 */
  private boolean matchesField(String userValue, String jobValue) {
    if (isBlank(userValue) || isBlank(jobValue)) return false;
    String u = userValue.toLowerCase();
    String j = jobValue.toLowerCase();
    return u.contains(j) || j.contains(u);
  }

  /** 학력 비교 (레벨 기반) */
  private boolean matchesEducation(String userEdu, String jobEdu) {
    if (isBlank(userEdu) || isBlank(jobEdu)) return false;

    int userLevel = getEducationLevel(userEdu);
    int jobLevel = getEducationLevel(jobEdu);

    return userLevel >= jobLevel;
  }

  private int getEducationLevel(String education) {
    if (education == null) return 0;
    String lower = education.toLowerCase();
    if (lower.contains("박사")) return 5;
    if (lower.contains("석사")) return 4;
    if (lower.contains("대졸") || lower.contains("학사") || lower.contains("대학교")) return 3;
    if (lower.contains("초대졸") || lower.contains("전문대")) return 2;
    if (lower.contains("고졸")) return 1;
    if (lower.contains("무관")) return 0;
    return 0;
  }

  /** 경력 비교 (부분 일치 + 무관 허용) */
  private boolean matchesCareerLevel(String userCareer, String jobCareer) {
    if (isBlank(userCareer) || isBlank(jobCareer)) return false;

    if (jobCareer.contains("무관") || jobCareer.contains("신입")) return true;

    String u = userCareer.toLowerCase();
    String j = jobCareer.toLowerCase();
    return u.contains(j) || j.contains(u);
  }

  /**
   * 🔥 직무 유사도 계산 (0.0 ~ 1.0)
   * - 완전 일치: 1.0
   * - 부분 일치: 0.5
   * - 공통 단어: 0.3
   */
  private double positionSimilarity(String userPosition, String jobPosition) {
    if (isBlank(userPosition) || isBlank(jobPosition)) return 0;

    String u = userPosition.toLowerCase();
    String j = jobPosition.toLowerCase();

    if (u.equals(j)) return 1.0;
    if (u.contains(j) || j.contains(u)) return 0.7;

    if (u.contains("개발") && j.contains("개발")) return 0.5;
    if (u.contains("백엔드") && j.contains("server")) return 0.5;
    if (u.contains("프론트") && j.contains("ui")) return 0.5;

    return 0.0;
  }
}
