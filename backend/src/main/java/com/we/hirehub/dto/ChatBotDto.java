package com.we.hirehub.dto;

import lombok.*;

import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChatBotDto {
    private Long id;
    private String content;        // 질문
    private String botAnswer;      // 답변
    private String category;       // 카테고리 (meta에서 추출)
    private String sessionId;
    private Long userId;
    private LocalDate createAt;
}