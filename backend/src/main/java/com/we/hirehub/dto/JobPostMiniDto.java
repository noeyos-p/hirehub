// 캘린더 셀에 뿌릴 미니 카드
package com.we.hirehub.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.time.LocalDate;

@Data @AllArgsConstructor
public class JobPostMiniDto {
    private Long id;
    private String title;
    private String companyName;
    private LocalDate endAt;   // 셀/툴팁에 쓰거나 클릭 시 식별용
}
