package com.we.hirehub.dto.common;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CompanyStatsDto {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ChartData {
        private String year;
        private Integer sales;        // 매출액 (억원)
        private Integer avgSalary;    // 평균 연봉 (만원)
        private Integer newSalary;    // 신입 평균 연봉 (만원)
        private Integer employees;    // 사원 수
        private Double avgAge;        // 평균 나이
    }

    private List<ChartData> chartData;
    private Integer totalEmployees;   // 현재 총 사원수
    private Double currentAvgAge;     // 현재 평균 나이
}
