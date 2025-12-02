package com.we.hirehub.dto.aiMapper;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder

public class AiNewsDigestRequest {
    private String query;   // e.g. "채용 OR 공채"
    private Integer days;   // e.g. 3
    private Integer limit;  // e.g. 20
    private String style;   // "bullet" | "narrative"
    private Long botUserId; // 게시글 등록자(봇) 사용자 ID (없으면 null)
}
