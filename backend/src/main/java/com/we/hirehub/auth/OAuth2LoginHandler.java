package com.we.hirehub.auth;

import com.we.hirehub.config.JwtTokenProvider;
import com.we.hirehub.entity.Users;
import com.we.hirehub.repository.UsersRepository;
import com.we.hirehub.service.AuthService;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

/**
 * OAuth2 로그인 성공/실패 핸들러 (REST API + React 연동)
 * - JWT 토큰 생성 후 React 프론트엔드로 리다이렉트
 * - 신규 사용자는 온보딩 필요 플래그와 함께 전달
 */
@Component
@RequiredArgsConstructor
public class OAuth2LoginHandler implements
        org.springframework.security.web.authentication.AuthenticationSuccessHandler,
        org.springframework.security.web.authentication.AuthenticationFailureHandler {

    private final AuthService authService;
    private final UsersRepository usersRepository;
    private final JwtTokenProvider tokenProvider;

    @Value("${app.frontend.url:http://localhost:3000}")
    private String frontendUrl;

    @Override
    @Transactional
    public void onAuthenticationSuccess(HttpServletRequest request,
                                        HttpServletResponse response,
                                        Authentication authentication) throws IOException, ServletException {

        if (!(authentication.getPrincipal() instanceof OAuth2User oAuth2User)) {
            response.sendRedirect(frontendUrl + "/login?error=invalid_oauth_response");
            return;
        }

        // 구글에서 받은 사용자 정보
        String email = String.valueOf(oAuth2User.getAttributes().getOrDefault("email", ""));

        if (email.isBlank()) {
            response.sendRedirect(frontendUrl + "/login?error=no_email");
            return;
        }

        // 기존 사용자 확인을 위한 체크
        boolean isNewUser = !usersRepository.existsByEmail(email);

        // AuthService를 통한 사용자 생성/조회 (name 파라미터 제거)
        Users user = authService.createOrUpdateOAuth2User(email);

        // JWT 토큰 생성
        String accessToken = tokenProvider.createToken(user.getEmail(), user.getId());

        // React 프론트엔드로 리다이렉트 (토큰 + 신규 사용자 여부 전달)
        String redirectUrl = UriComponentsBuilder.fromUriString(frontendUrl)
                .path("/signInfo")
                .queryParam("token", accessToken)
                .queryParam("isNewUser", isNewUser)
                .build()
                .toUriString();

        response.sendRedirect(redirectUrl);
    }

    @Override
    public void onAuthenticationFailure(HttpServletRequest request,
                                        HttpServletResponse response,
                                        org.springframework.security.core.AuthenticationException exception)
            throws IOException, ServletException {

        String errorMessage = URLEncoder.encode(exception.getMessage(), StandardCharsets.UTF_8);
        response.sendRedirect(frontendUrl + "/login?error=" + errorMessage);
    }
}