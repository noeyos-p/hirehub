// 날짜별로 묶어 내려주기
package com.we.hirehub.dto.common;

import com.we.hirehub.dto.job.JobPostsDto;
import lombok.AllArgsConstructor;
import lombok.Data;

import java.time.LocalDate;
import java.util.List;

@Data @AllArgsConstructor
public class CalendarDto {
    private LocalDate date;
    private List<JobPostsDto.Mini> items;   // 해당 날짜 마감 공고들
}
