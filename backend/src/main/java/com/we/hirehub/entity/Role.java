package com.we.hirehub.entity;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

/** 완료 */

@Getter
@RequiredArgsConstructor
public enum Role {
    USER("ROLE_USER"),
    PREMIUM("ROLE_PREMIUM"),
    ADMIN("ROLE_ADMIN"),
    BOT("ROLE_BOT");

    private final String value;
}