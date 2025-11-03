// src/main/java/com/we/hirehub/naverauth/dto/NaverUserResponse.java
package com.we.hirehub.dto;

import lombok.Data;

import java.util.Map;

@Data
public class NaverUserResponse {
    private String resultcode;
    private String message;
    private Map<String, Object> response;

    public String getEmailOrFallback() {
        if (response != null) {
            Object v = response.get("email");
            if (v instanceof String s && !s.isBlank()) return s;
            Object id = response.get("id");
            if (id != null) return "naver_" + id + "@naver.local";
        }
        return "naver_unknown@naver.local";
    }

    public String getNameOrEmail() {
        if (response != null) {
            Object name = response.get("name");
            if (name instanceof String s && !s.isBlank()) return s;
        }
        return getEmailOrFallback();
    }
}
