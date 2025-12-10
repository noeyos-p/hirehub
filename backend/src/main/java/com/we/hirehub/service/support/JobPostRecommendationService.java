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

  /**
   * 유저 기반 추천 공고 조회
   */
  @Transactional(readOnly = true)
  public List<JobPostsDto> getRecommendedJobs(Long userId) {
    Users user = usersRepository.findById(userId)
        .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));

    log.info("🤖 AI 추천 공고 조회 - userId: {}, 프로필: 학력={}, 경력={}, 직무={}, 위치={}",
        userId, user.getEducation(), user.getCareerLevel(), user.getPosition(), user.getLocation());

    // 유저 프로필이 모두 비어있으면 조회수 기준으로 fallback
    if (isProfileEmpty(user)) {
      log.info("⚠️ 유저 프로필 비어있음 - 조회수 기준 fallback");
      return getPopularJobs();
    }

    List<JobPosts> allJobs = jobPostsRepository.findAllWithTechStacks();
    log.info("📋 전체 공고 수: {}", allJobs.size());

    if (allJobs.isEmpty()) {
      log.warn("⚠️ 공고가 없음!");
      return List.of();
    }

    // 점수 계산 후 정렬
    List<JobPostsDto> recommended = allJobs.stream()
        .map(job -> {
          int score = calculateMatchScore(user, job);
          JobPostsDto dto = JobPostsDto.toDto(job);
          dto.setRecommendScore(score);
          return dto;
        })
        .sorted(Comparator
            .comparingInt(JobPostsDto::getRecommendScore).reversed()
            .thenComparing(
                Comparator.comparingLong((JobPostsDto dto) -> dto.getViews() != null ? dto.getViews() : 0L).reversed()))
        .limit(15)
        .collect(Collectors.toList());

    log.info("🎯 AI 추천 공고 {}개 반환 (최고점수: {})",
        recommended.size(),
        recommended.isEmpty() ? 0 : recommended.get(0).getRecommendScore());

    return recommended;
  }

  private boolean isProfileEmpty(Users user) {
    return isBlank(user.getEducation()) &&
        isBlank(user.getCareerLevel()) &&
        isBlank(user.getPosition()) &&
        isBlank(user.getLocation());
  }

  private boolean isBlank(String str) {
    return str == null || str.trim().isEmpty();
  }

  private List<JobPostsDto> getPopularJobs() {
    return jobPostsRepository.findAllWithTechStacks().stream()
        .sorted(Comparator.comparingLong(JobPosts::getViews).reversed())
        .limit(15)
        .map(JobPostsDto::toDto)
        .collect(Collectors.toList());
  }

  /**
   * 매칭 점수 계산 (최대 100점)
   * - 직무: 30점, 학력: 25점, 경력: 25점, 위치: 20점
   */
  private int calculateMatchScore(Users user, JobPosts job) {
    int score = 0;

    if (matchesField(user.getPosition(), job.getPosition())) {
      score += 30;
    }
    if (matchesEducation(user.getEducation(), job.getEducation())) {
      score += 25;
    }
    if (matchesCareerLevel(user.getCareerLevel(), job.getCareerLevel())) {
      score += 25;
    }
    if (matchesField(user.getLocation(), job.getLocation())) {
      score += 20;
    }

    return score;
  }

  private boolean matchesField(String userValue, String jobValue) {
    if (isBlank(userValue) || isBlank(jobValue))
      return false;
    String userLower = userValue.toLowerCase().trim();
    String jobLower = jobValue.toLowerCase().trim();
    return userLower.contains(jobLower) || jobLower.contains(userLower);
  }

  private boolean matchesEducation(String userEdu, String jobEdu) {
    if (isBlank(userEdu) || isBlank(jobEdu))
      return false;
    int userLevel = getEducationLevel(userEdu);
    int jobLevel = getEducationLevel(jobEdu);
    return userLevel >= jobLevel;
  }

  private int getEducationLevel(String education) {
    if (education == null)
      return 0;
    String lower = education.toLowerCase();
    if (lower.contains("박사"))
      return 5;
    if (lower.contains("석사"))
      return 4;
    if (lower.contains("대졸") || lower.contains("대학교") || lower.contains("학사"))
      return 3;
    if (lower.contains("초대졸") || lower.contains("전문대"))
      return 2;
    if (lower.contains("고졸") || lower.contains("고등학교"))
      return 1;
    if (lower.contains("학력무관") || lower.contains("무관"))
      return 0;
    return 0;
  }

  private boolean matchesCareerLevel(String userCareer, String jobCareer) {
    if (isBlank(userCareer) || isBlank(jobCareer))
      return false;
    if (jobCareer.contains("무관") || jobCareer.contains("신입"))
      return true;
    String userLower = userCareer.toLowerCase();
    String jobLower = jobCareer.toLowerCase();
    return userLower.contains(jobLower) || jobLower.contains(userLower);
  }
}
