// 날짜별로 묶어 내려주기
package com.we.hirehub.dto.user;

import com.we.hirehub.dto.support.JobPostsDto;
import lombok.AllArgsConstructor;
import lombok.Data;

import java.time.LocalDate;
import java.util.List;

@Data @AllArgsConstructor
public class CalendarDto {

    @Data
    @AllArgsConstructor
    public static class DayItems {
        private LocalDate date;
        private List<JobPostsDto.Mini> items;
    }

    @Data
    @AllArgsConstructor
    public static class DayCount {
        private LocalDate date;
        private long count;
    }
}