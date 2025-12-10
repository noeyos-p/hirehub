package com.we.hirehub.controller.common;

import com.we.hirehub.dto.user.CalendarDto;
import com.we.hirehub.dto.common.PagedResponse;
import com.we.hirehub.dto.user.FavoriteDto;
import com.we.hirehub.dto.support.JobPostsDto;
import com.we.hirehub.service.support.JobPostScrapService;
import com.we.hirehub.service.support.JobPostService;
import com.we.hirehub.service.support.JobPostsCalendarService;
import com.we.hirehub.service.support.JobPostRecommendationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/jobposts")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class JobPostController {

  private final JobPostScrapService jobPostScrapService;
  private final JobPostsCalendarService jobPostsCalendarService;
  private final JobPostService jobPostService;
  private final JobPostRecommendationService jobPostRecommendationService;

  private Long userId(Authentication auth) {
    if (auth == null) {
      auth = SecurityContextHolder.getContext().getAuthentication();
      if (auth == null)
        throw new IllegalStateException("인증 정보가 없습니다.");
    }
    Object p = auth.getPrincipal();

    // 🔥 JwtUserPrincipal 처리 (가장 먼저!)
    if (p instanceof com.we.hirehub.config.JwtUserPrincipal jwt) {
      Long userId = jwt.getUserId();
      log.debug("✅ JwtUserPrincipal userId = {}", userId);
      return userId;
    }

    if (p instanceof Long l)
      return l;
    if (p instanceof String s) {
      try {
        return Long.parseLong(s);
      } catch (NumberFormatException ignore) {
      }
    }
    try {
      var m = p.getClass().getMethod("getId");
      Object v = m.invoke(p);
      if (v instanceof Long l)
        return l;
      if (v instanceof String s)
        return Long.parseLong(s);
    } catch (Exception ignore) {
    }
    throw new IllegalStateException("현재 사용자 ID를 확인할 수 없습니다.");
  }

  /**
   * 공고 전체 조회
   * ⭐ lat/lng 포함된 DTO 자동 반환됨
   */
  @GetMapping
  public List<JobPostsDto> getAllJobPosts() {
    log.info("🌐 GET /api/jobposts - getAllJobPosts 호출됨");
    return jobPostService.getAllJobPosts();
  }

  /**
   * 공고 상세 조회
   * ⭐ lat/lng 프론트로 전달됨
   */
  @GetMapping("/{id}")
  public JobPostsDto getJobPostById(@PathVariable Long id) {
    log.info("🌐 GET /api/jobposts/{} - Controller 진입!", id);

    JobPostsDto result = jobPostService.getJobPostById(id);

    // ⭐ 디버그: 지도 표시용 위경도 출력
    log.info("📍 지도 표기용 lat={}, lng={}", result.getLat(), result.getLng());
    log.info("🌐 Controller 반환 photo: {}", result.getPhoto());

    return result;
  }

  @GetMapping("/search")
  public List<JobPostsDto> searchJobPosts(@RequestParam String keyword) {
    log.info("🌐 GET /api/jobposts/search?keyword={}", keyword);
    return jobPostService.searchJobPosts(keyword);
  }

  @PostMapping
  public JobPostsDto createJobPost(@RequestBody JobPostsDto jobPostsDto) {
    log.info("🌐 POST /api/jobposts - createJobPost 호출됨");
    return jobPostService.createJobPost(jobPostsDto);
  }

  @PostMapping("/{jobPostId}/scrap")
  public ResponseEntity<FavoriteDto.ScrapPostsDto> scrap(
      Authentication auth,
      @PathVariable Long jobPostId) {
    Long uid = userId(auth);
    return ResponseEntity.ok(jobPostScrapService.add(uid, jobPostId));
  }

  /**
   * 🔥 AI 추천 공고 조회
   * 로그인된 유저 프로필 기반 맞춤 추천
   */
  @GetMapping("/recommended")
  public ResponseEntity<List<JobPostsDto>> getRecommendedJobs(Authentication auth) {
    try {
      Long uid = userId(auth);
      log.info("🤖 GET /api/jobposts/recommended - userId: {}", uid);
      List<JobPostsDto> recommended = jobPostRecommendationService.getRecommendedJobs(uid);
      return ResponseEntity.ok(recommended);
    } catch (Exception e) {
      log.warn("⚠️ 추천 공고 조회 실패 (비로그인 또는 오류): {}", e.getMessage());
      return ResponseEntity.ok(List.of()); // 빈 리스트 반환 (fallback은 프론트에서 처리)
    }
  }

  @GetMapping("/calendar")
  public List<CalendarDto.DayItems> getCalendar(
      @RequestParam LocalDate from,
      @RequestParam LocalDate to) {
    return jobPostsCalendarService.getCalendar(from, to);
  }

  @GetMapping("/deadlines")
  public PagedResponse<JobPostsDto.Mini> getDayDeadlines(
      @RequestParam LocalDate date,
      @RequestParam(defaultValue = "0") int page,
      @RequestParam(defaultValue = "10") int size) {
    return jobPostsCalendarService.getDayDeadlines(date, page, size);
  }

  @GetMapping("/calendar/counts")
  public List<CalendarDto.DayCount> getCalendarCounts(
      @RequestParam LocalDate from,
      @RequestParam LocalDate to) {
    return jobPostsCalendarService.getCalendarCounts(from, to);
  }

  @PostMapping("/{id}/views")
  public JobPostsDto incrementViews(@PathVariable Long id) {
    log.info("🌐 POST /api/jobposts/{}/views - incrementViews 호출됨", id);
    return jobPostService.incrementViews(id);
  }
}
