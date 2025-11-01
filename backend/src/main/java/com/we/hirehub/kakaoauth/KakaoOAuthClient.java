package com.we.hirehub.kakaoauth;

import com.we.hirehub.dto.KakaoTokenResponse;
import com.we.hirehub.dto.KakaoUserResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClient;

@Component
@RequiredArgsConstructor
public class KakaoOAuthClient {

    private final RestClient rest = RestClient.builder().build();

    public KakaoTokenResponse exchangeToken(String code, KakaoOAuthProperties props) {
        MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
        form.add("grant_type", "authorization_code");
        form.add("client_id", props.getClientId());
        form.add("redirect_uri", props.getRedirectUri());
        form.add("code", code);
        if (props.getClientSecret() != null && !props.getClientSecret().isBlank()) {
            form.add("client_secret", props.getClientSecret());
        }

        return rest.post()
                .uri("https://kauth.kakao.com/oauth/token")
                .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                .body(form)
                .retrieve()
                .body(KakaoTokenResponse.class);
    }

    public KakaoUserResponse fetchUser(String accessToken) {
        return rest.get()
                .uri("https://kapi.kakao.com/v2/user/me")
                .header("Authorization", "Bearer " + accessToken)
                .retrieve()
                .body(KakaoUserResponse.class);
    }
}
