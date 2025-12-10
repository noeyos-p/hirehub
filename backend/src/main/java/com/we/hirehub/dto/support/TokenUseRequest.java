package com.we.hirehub.dto.support;

import lombok.Getter;
import lombok.Setter;

@Getter @Setter
public class TokenUseRequest {
    private int amount;         // 차감할 토큰 수
    private String feature;     // COVER_LETTER, MATCHING, COACHING 등
    private String description; // 프론트에서 보낼 상세 사용 이유
}
