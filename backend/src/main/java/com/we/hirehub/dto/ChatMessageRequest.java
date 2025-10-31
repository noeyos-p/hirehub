package com.we.hirehub.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChatMessageRequest {
    private String sessionId;
    private String content;
    private String nickname;  // 추가
    private Long userId;      // Users ID 추가
}
