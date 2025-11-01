// src/main/java/com/we/hirehub/kakaoauth/KakaoAuthController.java
package com.we.hirehub.kakaoauth;

import com.we.hirehub.dto.KakaoAuthResult;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.servlet.view.RedirectView;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

@Slf4j
@Controller
@RequiredArgsConstructor
public class KakaoAuthController {

    private final KakaoOAuthProperties props;
    private final KakaoAuthService kakaoAuthService;

    @GetMapping("/api/auth/kakao")
    public void launchKakao(HttpServletResponse res) throws IOException {
        res.sendRedirect("/oauth2/authorization/kakao");
    }


    /** 카카오 로그인 시작 (세션 정리 후 독립 플로우) */
    @GetMapping("/kakao/login")
    public String start(HttpServletRequest req) {
        var s = req.getSession(false);
        if (s != null) s.invalidate();
        SecurityContextHolder.clearContext();

        return "redirect:" + kakaoAuthService.buildAuthorizeUrl(props);
    }

    /** 카카오 콜백 (인가코드 → 토큰 → 유저 조회 → JWT 발급 → 프론트 콜백 리다이렉트) */
    @GetMapping("/kakao/callback")
    public String callback(String code) {
        KakaoAuthResult result = kakaoAuthService.handleCallback(code, props);

        String redirect = props.getFrontRedirectUrl()
                + "?token=" + java.net.URLEncoder.encode(result.jwt(), java.nio.charset.StandardCharsets.UTF_8)
                + "&isNewUser=" + result.isNewUser();

        return "redirect:" + redirect;
    }

    @GetMapping("/kakao")
    public RedirectView kakao() {
        // [OAUTH ENTRY] 카카오 OAuth로 넘김
        return new RedirectView("/oauth2/authorization/kakao");
    }

}
