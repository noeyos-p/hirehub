package com.we.hirehub.dto.common;

import com.we.hirehub.dto.job.JobPostsDto;
import lombok.*;

import java.time.LocalDate;
import java.util.List;

/**
 * CalendarDtos + DeadlineCountDtos 완전 통합 DTO
 * 날짜별 공고 목록(Calendar) 또는 공고 개수(Count) 둘 다 표현 가능
 * 기존 코드 100% 하위호환
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CalendarSummaryDto {

    private LocalDate date;                    // 공통 날짜
    private List<JobPostsDto.Mini> items;      // CalendarDtos: 해당 날짜 상세 공고 리스트
    private Long count;                        // DeadlineCountDtos: 해당 날짜 공고 개수

    // --------------------------
    // 🔥 하위호환 생성자 1
    //   CalendarDtos(date, items)
    // --------------------------
    public CalendarSummaryDto(LocalDate date, List<JobPostsDto.Mini> items) {
        this.date = date;
        this.items = items;
        this.count = null;
    }

    // --------------------------
    // 🔥 하위호환 생성자 2
    //   DeadlineCountDtos(date, count)
    // --------------------------
    public CalendarSummaryDto(LocalDate date, long count) {
        this.date = date;
        this.count = count;
        this.items = null;
    }
}
