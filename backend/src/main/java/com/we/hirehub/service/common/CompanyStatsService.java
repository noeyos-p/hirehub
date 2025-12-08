package com.we.hirehub.service.common;

import com.we.hirehub.dto.common.CompanyStatsDto;
import com.we.hirehub.entity.*;
import com.we.hirehub.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CompanyStatsService {

    private final AvgSalaryRepository avgSalaryRepository;
    private final TotalSalesRepository totalSalesRepository;
    private final NewSalaryRepository newSalaryRepository;
    private final CompanyRepository companyRepository;
    private final AgeAverageRepository ageAverageRepository;

    public CompanyStatsDto getCompanyStats(Long companyId) {
        // 1. 통계 데이터 조회
        List<AvgSalary> avgSalaries = avgSalaryRepository.findByCompanyIdOrderByYearAsc(companyId);
        List<TotalSales> totalSales = totalSalesRepository.findByCompanyIdOrderByYearAsc(companyId);
        List<NewSalary> newSalaries = newSalaryRepository.findByCompanyIdOrderByYearAsc(companyId);

        // 2. 회사 정보 조회 (사원수)
        Company company = companyRepository.findById(companyId)
                .orElseThrow(() -> new RuntimeException("회사를 찾을 수 없습니다."));

        Integer totalEmployees = parseInteger(company.getCount());

        // 3. 평균 나이 계산 (Apply에서 해당 회사에 지원한 유저들의 평균 나이)
        Double currentAvgAge = calculateAverageAge(companyId);

        // 4. 연도별 데이터 병합
        Map<String, CompanyStatsDto.ChartData> dataMap = new HashMap<>();

        // 매출액
        for (TotalSales ts : totalSales) {
            dataMap.putIfAbsent(ts.getYear(), CompanyStatsDto.ChartData.builder()
                    .year(ts.getYear())
                    .build());
            dataMap.get(ts.getYear()).setSales(parseInteger(ts.getSales()));
        }

        // 평균 연봉
        for (AvgSalary as : avgSalaries) {
            dataMap.putIfAbsent(as.getYear(), CompanyStatsDto.ChartData.builder()
                    .year(as.getYear())
                    .build());
            dataMap.get(as.getYear()).setAvgSalary(parseInteger(as.getSalary()));
        }

        // 신입 연봉
        for (NewSalary ns : newSalaries) {
            dataMap.putIfAbsent(ns.getYear(), CompanyStatsDto.ChartData.builder()
                    .year(ns.getYear())
                    .build());
            dataMap.get(ns.getYear()).setNewSalary(parseInteger(ns.getSalary()));
        }

        // 5. 연도순 정렬
        List<CompanyStatsDto.ChartData> chartData = dataMap.values().stream()
                .sorted(Comparator.comparing(CompanyStatsDto.ChartData::getYear))
                .collect(Collectors.toList());

        return CompanyStatsDto.builder()
                .chartData(chartData)
                .totalEmployees(totalEmployees)
                .currentAvgAge(currentAvgAge)
                .build();
    }

    /**
     * age_average 테이블에서 해당 회사의 나이 데이터를 가져와 평균 계산
     */
    private Double calculateAverageAge(Long companyId) {
        // age_average 테이블에서 해당 회사의 나이 데이터 조회
        List<AgeAverage> ageAverages = ageAverageRepository.findByCompanyId(companyId);

        if (ageAverages.isEmpty()) {
            return 0.0;
        }

        // 평균 나이 계산
        return ageAverages.stream()
                .mapToLong(AgeAverage::getAge)
                .average()
                .orElse(0.0);
    }

    /**
     * String을 Integer로 파싱 (실패시 0 반환)
     */
    private Integer parseInteger(String value) {
        if (value == null || value.isEmpty()) {
            return 0;
        }
        try {
            // 콤마, 문자 등 제거하고 숫자만 남김
            String cleanValue = value.replaceAll("[^0-9]", "");
            return Integer.parseInt(cleanValue);
        } catch (NumberFormatException e) {
            return 0;
        }
    }
}
