package com.we.hirehub.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

import java.util.Map;

@Data
public class KakaoUserResponse {
    private Long id;

    @JsonProperty("kakao_account")
    private Map<String, Object> kakaoAccount;

    public String getEmailOrFallback() {
        if (kakaoAccount != null) {
            Object email = kakaoAccount.get("email");
            if (email != null) return String.valueOf(email);
        }
        return "kakao_" + id + "@kakao.local";
    }

    public String getNicknameOrEmail() {
        if (kakaoAccount != null) {
            Object profileObj = kakaoAccount.get("profile");
            if (profileObj instanceof Map<?,?> m) {
                Object nn = m.get("nickname");
                if (nn != null) return String.valueOf(nn);
            }
        }
        return getEmailOrFallback();
    }
}
