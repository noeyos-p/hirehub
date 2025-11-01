// src/main/java/com/we/hirehub/naverauth/NaverOAuthClient.java
package com.we.hirehub.naverauth;

import com.we.hirehub.dto.NaverTokenResponse;
import com.we.hirehub.dto.NaverUserResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClient;

@Component
@RequiredArgsConstructor
public class NaverOAuthClient {

    private final RestClient rest = RestClient.builder().build();

    public NaverTokenResponse exchangeCode(String code,
                                           String clientId,
                                           String clientSecret,
                                           String redirectUri) {
        MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
        form.add("grant_type", "authorization_code");
        form.add("client_id", clientId);
        form.add("client_secret", clientSecret);
        form.add("code", code);
        form.add("redirect_uri", redirectUri);
        // NOTE: 네이버는 state 검증 옵션을 권장하지만, 카카오 구조와 일치시키기 위해 생략

        return rest.post()
                .uri("https://nid.naver.com/oauth2.0/token")
                .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                .body(form)
                .retrieve()
                .body(NaverTokenResponse.class);
    }

    public NaverUserResponse fetchUser(String accessToken) {
        return rest.get()
                .uri("https://openapi.naver.com/v1/nid/me")
                .header("Authorization", "Bearer " + accessToken)
                .retrieve()
                .body(NaverUserResponse.class);
    }
}
