// 날짜별로 묶어 내려주기
package com.we.hirehub.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.time.LocalDate;
import java.util.List;

@Data @AllArgsConstructor
public class CalendarDayDto {
    private LocalDate date;
    private List<JobPostMiniDto> items;   // 해당 날짜 마감 공고들
}
