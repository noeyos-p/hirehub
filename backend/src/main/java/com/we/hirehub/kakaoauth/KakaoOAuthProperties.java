// src/main/java/com/we/hirehub/kakaoauth/KakaoOAuthProperties.java
package com.we.hirehub.kakaoauth;

import lombok.Getter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Getter
@Configuration
@ConfigurationProperties(prefix = "kakao.oauth")
public class KakaoOAuthProperties {
    private String clientId;
    private String clientSecret;
    private String redirectUri;
    private String frontRedirectUrl; // 프론트 콜백 (JWT 전달용)

    public void setClientId(String v){ this.clientId = v; }
    public void setClientSecret(String v){ this.clientSecret = v; }
    public void setRedirectUri(String v){ this.redirectUri = v; }
    public void setFrontRedirectUrl(String v){ this.frontRedirectUrl = v; }
}
