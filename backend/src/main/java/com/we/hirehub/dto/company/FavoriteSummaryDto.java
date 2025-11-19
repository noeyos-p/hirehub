package com.we.hirehub.dto.company;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

/**
 * FavoriteCompanySummaryDtos + FavoriteJobPostSummaryDtos 완전 통합 버전
 * 기존 모든 API/서비스와 100% 하위 호환
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class FavoriteSummaryDto {

    private Long favoriteId;

    private Long companyId;
    private String companyName;
    private Long openPostCount;

    private Long jobPostId;
    private String title;
    private LocalDate endAt;

    private String type;

    // --- 기존 JobPostSummaryDto 생성자 (하위호환) ---
    public FavoriteSummaryDto(
            Long favoriteId,
            Long jobPostId,
            String title,
            String companyName,
            LocalDate endAt
    ) {
        this.favoriteId = favoriteId;
        this.jobPostId = jobPostId;
        this.title = title;
        this.companyName = companyName;
        this.endAt = endAt;
        this.type = "JOB";
    }

    // --- 기존 FavoriteCompanySummaryDtos 생성자 (하위호환) ---
    public FavoriteSummaryDto(
            Long favoriteId,
            Long companyId,
            String companyName,
            Long openPostCount
    ) {
        this.favoriteId = favoriteId;
        this.companyId = companyId;
        this.companyName = companyName;
        this.openPostCount = openPostCount;
        this.type = "COMPANY";
    }
}
