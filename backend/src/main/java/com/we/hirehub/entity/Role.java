package com.we.hirehub.entity;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

/** 완료 */

@Getter
@RequiredArgsConstructor
public enum Role {
    USER("ROLE_USER"),
    ADMIN("ROLE_ADMIN");

    private final String value;
}
