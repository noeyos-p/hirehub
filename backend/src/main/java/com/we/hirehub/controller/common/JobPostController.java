package com.we.hirehub.controller.common;

import com.we.hirehub.config.JwtUserPrincipal;
import com.we.hirehub.dto.user.CalendarDto;
import com.we.hirehub.dto.common.PagedResponse;
import com.we.hirehub.dto.user.FavoriteDto;
import com.we.hirehub.dto.support.JobPostsDto;
import com.we.hirehub.service.support.JobPostScrapService;
import com.we.hirehub.service.support.JobPostService;
import com.we.hirehub.service.support.JobPostsCalendarService;
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

  private Long userId(Authentication auth) {
    if (auth == null || auth.getPrincipal() == null) {
      throw new IllegalStateException("인증 정보가 없습니다.");
    }

    Object p = auth.getPrincipal();

    // ⭐ JwtUserPrincipal 기반 인증
    if (p instanceof JwtUserPrincipal principal) {
      return principal.getUserId();
    }

    // 혹시 이상하게 String 형태로 들어온 경우
    if (p instanceof String s) {
      try {
        return Long.parseLong(s);
      } catch (NumberFormatException ignore) {}
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
          @PathVariable Long jobPostId
  ) {
    Long uid = userId(auth);
    return ResponseEntity.ok(jobPostScrapService.add(uid, jobPostId));
  }

  @GetMapping("/calendar")
  public List<CalendarDto.DayItems> getCalendar(
          @RequestParam LocalDate from,
          @RequestParam LocalDate to
  ) {
    return jobPostsCalendarService.getCalendar(from, to);
  }

  @GetMapping("/deadlines")
  public PagedResponse<JobPostsDto.Mini> getDayDeadlines(
          @RequestParam LocalDate date,
          @RequestParam(defaultValue = "0") int page,
          @RequestParam(defaultValue = "10") int size
  ) {
    return jobPostsCalendarService.getDayDeadlines(date, page, size);
  }

  @GetMapping("/calendar/counts")
  public List<CalendarDto.DayCount> getCalendarCounts(
          @RequestParam LocalDate from,
          @RequestParam LocalDate to
  ) {
    return jobPostsCalendarService.getCalendarCounts(from, to);
  }

  @PostMapping("/{id}/views")
  public JobPostsDto incrementViews(@PathVariable Long id) {
    log.info("🌐 POST /api/jobposts/{}/views - incrementViews 호출됨", id);
    return jobPostService.incrementViews(id);
  }

  /**
   * 🔥 로그인 기반 추천 공고
   */
  @GetMapping("/recommended")
  public List<JobPostsDto> getRecommended(Authentication auth) {
    Long uid = userId(auth); // 현재 로그인한 사용자 ID 가져오기
    return jobPostService.getRecommendedJobs(uid); // 서비스 호출
  }
}