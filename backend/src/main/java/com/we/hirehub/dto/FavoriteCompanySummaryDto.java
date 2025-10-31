package com.we.hirehub.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

/** 마이페이지 - 관심 기업(회사 연관 기반) 리스트 아이템 */
@Data
@AllArgsConstructor
public class FavoriteCompanySummaryDto {
    private Long favoriteId;   // favorite_company PK
    private Long companyId;    // 회사 ID
    private String companyName;
    private long openPostCount; // 해당 회사의 공고 수(상태 필터 없으면 전체)
}
