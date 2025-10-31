// JobPostsCalendarService.java
package com.we.hirehub.service;

import com.we.hirehub.dto.CalendarDayDto;
import com.we.hirehub.dto.DeadlineCountDto;
import com.we.hirehub.dto.JobPostMiniDto;
import com.we.hirehub.dto.PagedResponse;
import com.we.hirehub.entity.JobPosts;
import com.we.hirehub.repository.JobPostsRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class JobPostsCalendarService {

    private final JobPostsRepository jobPostsRepository;

    /** 달력 범위 데이터: [from, to] 내 마감 공고들을 날짜별로 그룹 */
    public List<CalendarDayDto> getCalendar(LocalDate from, LocalDate to) {
        List<JobPosts> posts = jobPostsRepository.findByEndAtBetween(from, to);
        Map<LocalDate, List<JobPostMiniDto>> grouped = posts.stream()
                .collect(Collectors.groupingBy(
                        JobPosts::getEndAt,
                        Collectors.mapping(j -> new JobPostMiniDto(
                                j.getId(),
                                j.getTitle(),
                                j.getCompany().getName(),
                                j.getEndAt()
                        ), Collectors.toList())
                ));

        // 날짜 오름차순으로 반환
        return grouped.entrySet().stream()
                .sorted(Map.Entry.comparingByKey())
                .map(e -> new CalendarDayDto(e.getKey(), e.getValue()))
                .toList();
    }

    /** 특정 날짜 마감 리스트 (오른쪽 패널용, 페이징) */
    public PagedResponse<JobPostMiniDto> getDayDeadlines(LocalDate date, int page, int size) {
        Page<JobPosts> p = jobPostsRepository.findByEndAt(date,
                PageRequest.of(page, size, Sort.by(Sort.Direction.ASC, "title")));
        List<JobPostMiniDto> items = p.getContent().stream()
                .map(j -> new JobPostMiniDto(j.getId(), j.getTitle(), j.getCompany().getName(), j.getEndAt()))
                .toList();
        return new PagedResponse<>(items, p.getNumber(), p.getSize(), p.getTotalElements(), p.getTotalPages());
    }

    /** (선택) 날짜별 건수만 빠르게 */
    public List<DeadlineCountDto> getCalendarCounts(LocalDate from, LocalDate to) {
        return jobPostsRepository.countByEndAtBetween(from, to).stream()
                .map(a -> new DeadlineCountDto((LocalDate) a[0], (Long) a[1]))
                .toList();
    }
}
