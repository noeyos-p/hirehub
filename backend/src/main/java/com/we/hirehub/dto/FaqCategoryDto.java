package com.we.hirehub.dto;

import lombok.*;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FaqCategoryDto {
    private Long id;
    private String category;        // 카테고리 이름 (예: "지원관리")
    private String description;     // 카테고리 설명
    private List<FaqItemDto> items; // 하위 FAQ 항목들
}
