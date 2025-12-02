package com.we.hirehub.entity;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

/** 완료 */

@Getter
@RequiredArgsConstructor
public enum Role {
    USER("ROLE_USER"),
    ADMIN("ROLE_ADMIN"),
    BOT("ROLE_BOT");  // 🤖 추가된 봇 계정

    private final String value;
}
