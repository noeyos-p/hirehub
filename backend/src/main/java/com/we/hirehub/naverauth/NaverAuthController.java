// src/main/java/com/we/hirehub/naverauth/NaverAuthController.java
package com.we.hirehub.naverauth;

import com.we.hirehub.dto.NaverAuthResult;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.servlet.view.RedirectView;

@Slf4j
@Controller
@RequestMapping("/api/auth")  // ✅ RequestMapping 추가
@RequiredArgsConstructor
public class NaverAuthController {

    private final NaverAuthService service;
    private final NaverOAuthProperties props;

    /** ✅ /api/auth/naver 경로 명시 */
    @GetMapping("/naver")
    public RedirectView naver() {
        log.info("네이버 OAuth2 로그인 시작");
        return new RedirectView("/oauth2/authorization/naver");
    }

    /** 선택형: 독립 인가 진입 */
    @GetMapping("/naver/login")
    public String loginRedirect() {
        String authorize = "https://nid.naver.com/oauth2.0/authorize"
                + "?response_type=code"
                + "&client_id=" + props.getClientId()
                + "&redirect_uri=" + java.net.URLEncoder.encode(props.getRedirectUri(), java.nio.charset.StandardCharsets.UTF_8)
                + "&scope=profile%20email";
        return "redirect:" + authorize;
    }

    /** 콜백: code → accessToken → 사용자 → JWT → 프론트로 리다이렉트 */
    @GetMapping("/naver/callback")
    public String callback(String code) {
        log.info("네이버 콜백 수신 - code: {}", code);
        NaverAuthResult result = service.handleCallback(code, props);
        String redirect = props.getFrontRedirectUrl()
                + "?token=" + java.net.URLEncoder.encode(result.jwt(), java.nio.charset.StandardCharsets.UTF_8)
                + "&isNewUser=" + result.isNewUser();
        log.info("프론트로 리다이렉트: {}", redirect);
        return "redirect:" + redirect;
    }
}