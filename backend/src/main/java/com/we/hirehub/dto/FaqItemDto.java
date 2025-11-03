package com.we.hirehub.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FaqItemDto {
    private Long id;
    private String question;  // 질문
    private String answer;    // 답변
    private String category;  // 소속 카테고리
}
