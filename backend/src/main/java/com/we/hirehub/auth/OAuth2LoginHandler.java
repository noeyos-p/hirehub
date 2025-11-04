// src/main/java/com/we/hirehub/auth/OAuth2LoginHandler.java
package com.we.hirehub.auth;

import com.we.hirehub.config.JwtTokenProvider;
import com.we.hirehub.entity.Users;
import com.we.hirehub.repository.UsersRepository;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.AuthenticationFailureHandler;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

@Slf4j
@Component
@RequiredArgsConstructor
public class OAuth2LoginHandler implements AuthenticationSuccessHandler, AuthenticationFailureHandler {

    private final JwtTokenProvider jwtTokenProvider;
    private final UsersRepository usersRepository;

    @Value("${app.front.base-url}")
    private String frontendUrl;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response, Authentication authentication)
            throws IOException, ServletException {

        log.info("=== OAuth2 로그인 성공 ===");

        try {
            OAuth2User oAuth2User = (OAuth2User) authentication.getPrincipal();
            log.info("OAuth2User Principal: {}", oAuth2User.getAttributes());

            // ✅ 공통 추출
            String email = oAuth2User.getAttribute("email");
            Object idObj = oAuth2User.getAttribute("id");
            Object uidObj = oAuth2User.getAttribute("uid");

            // ✅ [추가] Google용 sub 필드 처리
            Object subObj = oAuth2User.getAttribute("sub");

            Long userId = null;
            if (idObj != null) {
                userId = convertToLong(idObj);
            } else if (uidObj != null) {
                userId = convertToLong(uidObj);
            } else if (subObj != null) {
                userId = convertToLong(subObj);
            }

            if (email == null) {
                log.error("❌ OAuth2 이메일 누락");
                handleFailure(response, "OAuth2 사용자 이메일을 확인할 수 없습니다.");
                return;
            }

            // ✅ DB에서 사용자 찾기
            Users user = usersRepository.findByEmail(email)
                    .orElseThrow(() -> new IllegalArgumentException("User not found for email: " + email));

            log.info("✅ 사용자 조회 성공 - ID: {}, Email: {}", userId, email);

            // ✅ userId가 null이면 DB ID로 대체
            if (userId == null) {
                userId = user.getId();
                log.warn("⚠️ OAuth2에서 id 없음 → DB ID로 대체: {}", userId);
            }

            // ✅ JWT 발급
            String jwt = jwtTokenProvider.createToken(email, userId);
            log.info("✅ JWT 발급 완료");

            boolean isNewUser = isRequiresOnboarding(user);
            log.info("🔍 신규 사용자 여부: {}", isNewUser);

            String callbackUrl = frontendUrl + "/auth/callback"
                    + "?token=" + URLEncoder.encode(jwt, StandardCharsets.UTF_8)
                    + "&isNewUser=" + isNewUser
                    + "&email=" + URLEncoder.encode(email, StandardCharsets.UTF_8);

            log.info("프론트 콜백으로 리다이렉트: {}", callbackUrl);
            response.sendRedirect(callbackUrl);

        } catch (Exception e) {
            log.error("❌ OAuth2 로그인 처리 중 에러", e);
            handleFailure(response, e.getMessage());
        }
    }

    @Override
    public void onAuthenticationFailure(HttpServletRequest request, HttpServletResponse response, AuthenticationException exception)
            throws IOException, ServletException {
        log.error("❌ OAuth2 인증 실패", exception);
        handleFailure(response, exception.getMessage());
    }

    private void handleFailure(HttpServletResponse response, String message) throws IOException {
        String errorUrl = frontendUrl + "/login?error=" +
                URLEncoder.encode(message != null ? message : "Unknown error", StandardCharsets.UTF_8);
        response.sendRedirect(errorUrl);
    }

    private Long convertToLong(Object obj) {
        if (obj instanceof Number n) return n.longValue();
        if (obj instanceof String s) {
            try { return Long.parseLong(s); }
            catch (NumberFormatException ignored) {}
        }
        return null;
    }

    private boolean isRequiresOnboarding(Users user) {
        return isBlank(user.getName())
                || isBlank(user.getNickname())
                || isBlank(user.getPhone())
                || user.getDob() == null
                || user.getGender() == null
                || isBlank(user.getAddress())
                || isBlank(user.getLocation())
                || isBlank(user.getPosition())
                || isBlank(user.getCareerLevel())
                || isBlank(user.getEducation());
    }

    private static boolean isBlank(String s) {
        return s == null || s.trim().isBlank();
    }
}
