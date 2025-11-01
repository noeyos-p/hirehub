// src/main/java/com/we/hirehub/naverauth/NaverOAuthProperties.java
package com.we.hirehub.naverauth;

import lombok.Getter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Getter
@Configuration
@ConfigurationProperties(prefix = "naver.oauth")
public class NaverOAuthProperties {
    private String clientId;
    private String clientSecret;
    private String redirectUri;       // ex) https://api.your-domain.com/naver/callback
    private String frontRedirectUrl;  // ex) https://app.your-domain.com/auth/callback

    public void setClientId(String v){ this.clientId = v; }
    public void setClientSecret(String v){ this.clientSecret = v; }
    public void setRedirectUri(String v){ this.redirectUri = v; }
    public void setFrontRedirectUrl(String v){ this.frontRedirectUrl = v; }
}
