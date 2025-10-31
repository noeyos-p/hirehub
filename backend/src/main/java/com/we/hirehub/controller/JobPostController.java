package com.we.hirehub.controller;


import com.we.hirehub.dto.*;
import com.we.hirehub.service.JobPostScrapService;
import com.we.hirehub.service.JobPostServiceImpl;
import com.we.hirehub.service.JobPostsCalendarService;
import com.we.hirehub.service.JobPostsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/jobposts")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class JobPostController {

    private final JobPostsService jobPostService;
    private final JobPostScrapService jobPostScrapService;
    private final JobPostsCalendarService jobPostsCalendarService;
    private final JobPostServiceImpl jobPostServiceImpl;



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
        return jobPostService.getAllJobPosts();
    }

    @GetMapping("/{id}")
    public JobPostsDto getJobPostById(@PathVariable Long id) {
        return jobPostService.getJobPostById(id);
    }

    @GetMapping("/search")
    public List<JobPostsDto> searchJobPosts(@RequestParam String keyword) {
        return jobPostService.searchJobPosts(keyword);
    }

    @PostMapping
    public JobPostsDto createJobPost(@RequestBody JobPostsDto jobPostsDto) {
        return jobPostService.createJobPost(jobPostsDto);
    }

    // 스크랩 추가 (c)
    @PostMapping("/{jobPostId}/scrap")
    public ResponseEntity<FavoriteJobPostSummaryDto> scrap(Authentication auth,
                                                           @PathVariable Long jobPostId) {
        Long uid = userId(auth);
        return ResponseEntity.ok(jobPostScrapService.add(uid, jobPostId));
    }

    /** 달력 렌더링용: 범위 내 마감일 데이터 */
    @GetMapping("/calendar")
    public List<CalendarDayDto> getCalendar(
            @RequestParam LocalDate from,   // e.g. 2025-10-01
            @RequestParam LocalDate to      // e.g. 2025-10-31
    ) {
        return jobPostsCalendarService.getCalendar(from, to);
    }

    /** 특정 날짜 마감 목록 (오른쪽 패널용) */
    @GetMapping("/deadlines")
    public PagedResponse<JobPostMiniDto> getDayDeadlines(
            @RequestParam LocalDate date,   // e.g. 2025-10-08
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        return jobPostsCalendarService.getDayDeadlines(date, page, size);
    }

    /** (선택) 날짜별 마감 건수만 */
    @GetMapping("/calendar/counts")
    public List<DeadlineCountDto> getCalendarCounts(
            @RequestParam LocalDate from,
            @RequestParam LocalDate to
    ) {
        return jobPostsCalendarService.getCalendarCounts(from, to);
    }

    @PostMapping("/{id}/views")
    public JobPostsDto incrementViews(@PathVariable Long id) {
        return jobPostServiceImpl.incrementViews(id);
    }
}

