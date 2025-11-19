package com.we.hirehub.controller;

import com.we.hirehub.dto.common.CalendarSummaryDto;
import com.we.hirehub.dto.common.PagedResponse;
import com.we.hirehub.dto.company.FavoriteSummaryDto;
import com.we.hirehub.dto.job.JobPostsDto;
import com.we.hirehub.service.JobPostScrapService;
import com.we.hirehub.service.JobPostService;
import com.we.hirehub.service.JobPostsCalendarService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;  // ✅ 추가
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@Slf4j  // ✅ 추가
@RestController
@RequestMapping("/api/jobposts")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class JobPostController {

    private final JobPostScrapService jobPostScrapService;
    private final JobPostsCalendarService jobPostsCalendarService;
    private final JobPostService jobPostService;

    private Long userId(Authentication auth) {
        if (auth == null) {
            auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth == null) throw new IllegalStateException("인증 정보가 없습니다.");
        }
        Object p = auth.getPrincipal();
        if (p instanceof Long l) return l;
        if (p instanceof String s) {
            try { return Long.parseLong(s); } catch (NumberFormatException ignore) {}
        }
        try {
            var m = p.getClass().getMethod("getId");
            Object v = m.invoke(p);
            if (v instanceof Long l) return l;
            if (v instanceof String s) return Long.parseLong(s);
        } catch (Exception ignore) {}
        throw new IllegalStateException("현재 사용자 ID를 확인할 수 없습니다.");
    }

    @GetMapping
    public List<JobPostsDto> getAllJobPosts() {
        log.info("🌐 GET /api/jobposts - getAllJobPosts 호출됨");
        return jobPostService.getAllJobPosts();
    }

    @GetMapping("/{id}")
    public JobPostsDto getJobPostById(@PathVariable Long id) {
        log.info("🌐 GET /api/jobposts/{} - Controller 진입!", id);
        JobPostsDto result = jobPostService.getJobPostById(id);
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
    public ResponseEntity<FavoriteSummaryDto> scrap(Authentication auth,
                                                    @PathVariable Long jobPostId) {
        Long uid = userId(auth);
        return ResponseEntity.ok(jobPostScrapService.add(uid, jobPostId));
    }

    @GetMapping("/calendar")
    public List<CalendarSummaryDto> getCalendar(
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
    public List<CalendarSummaryDto> getCalendarCounts(
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
}