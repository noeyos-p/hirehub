package com.we.hirehub.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Collections;
import java.util.List;

@Slf4j
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtTokenProvider tokenProvider;

    public JwtAuthenticationFilter(JwtTokenProvider tokenProvider) {
        this.tokenProvider = tokenProvider;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain)
            throws ServletException, IOException {

        String path = request.getRequestURI();
        log.debug("🔍 JWT 필터 실행: {}", path);

        // ✅ 1️⃣ 인증 불필요 경로 화이트리스트 처리
        if (path.startsWith("/api/auth/")
                || path.startsWith("/api/public/")
                // ❌ 온보딩 제거 - 인증 필요하도록 변경
                // || path.startsWith("/api/onboarding/")
                || path.startsWith("/swagger-ui/")
                || path.startsWith("/v3/api-docs/")
                || path.startsWith("/login")
                || path.startsWith("/oauth2/")
                || path.equals("/")
                || path.startsWith("/ws/")
                || path.equals("/api/ads")  // ✅ 일반 사용자 광고 조회 추가
        ) {
            log.debug("🚫 인증 불필요 경로 → JWT 검증 생략: {}", path);
            filterChain.doFilter(request, response);
            return;
        }

        // ✅ 2️⃣ Authorization 헤더 직접 파싱
        String header = request.getHeader("Authorization");
        if (header == null || !header.startsWith("Bearer ")) {
            log.debug("⚠️ Authorization 헤더 없음 → 필터 통과");
            filterChain.doFilter(request, response);
            return;
        }

        String token = header.substring(7);
        log.debug("🪙 추출된 토큰: {}", token.substring(0, Math.min(15, token.length())) + "...");

        try {
            if (StringUtils.hasText(token) && tokenProvider.validate(token)) {
                Long userId = tokenProvider.getUserId(token);
                String email = tokenProvider.getUsername(token);

                List<GrantedAuthority> authorities =
                        Collections.singletonList(new SimpleGrantedAuthority("ROLE_USER"));

                JwtUserPrincipal principal =
                        new JwtUserPrincipal(userId, email, "ROLE_USER", authorities);

                UsernamePasswordAuthenticationToken authentication =
                        new UsernamePasswordAuthenticationToken(principal, null, authorities);

                SecurityContextHolder.getContext().setAuthentication(authentication);
                log.debug("✅ SecurityContext 설정 완료: {}", email);
            } else {
                log.debug("⚠️ 유효하지 않은 토큰");
            }
        } catch (Exception e) {
            log.error("❌ JWT 필터 예외: {}", e.getMessage());
        }

        filterChain.doFilter(request, response);
    }
}
