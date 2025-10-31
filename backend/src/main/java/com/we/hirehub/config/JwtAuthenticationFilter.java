package com.we.hirehub.config;

import com.we.hirehub.entity.Users;
import com.we.hirehub.repository.UsersRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Collections;

/**
 * JWT 인증 필터
 * - 모든 HTTP 요청에서 JWT 토큰을 검증
 * - Principal을 userId(Long)로 설정하여 Controller에서 사용
 */
@Slf4j
@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtTokenProvider tokenProvider;
    private final UserDetailsService userDetailsService;
    private final UsersRepository usersRepository;

    public JwtAuthenticationFilter(
            JwtTokenProvider tokenProvider,
            @Qualifier("dbUserDetailsService") UserDetailsService userDetailsService,
            UsersRepository usersRepository
    ) {
        this.tokenProvider = tokenProvider;
        this.userDetailsService = userDetailsService;
        this.usersRepository = usersRepository;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain chain) throws ServletException, IOException {

        String requestURI = request.getRequestURI();
        log.debug("🔍 JWT 필터 실행: {} {}", request.getMethod(), requestURI);

        try {
            String token = resolveToken(request);

            if (StringUtils.hasText(token) && tokenProvider.validate(token)) {
                // 토큰에서 userId 추출
                Long userId = tokenProvider.getUserId(token);
                String username = tokenProvider.getUsername(token);

                log.info("✅ JWT 검증 성공 - userId: {}, username: {}", userId, username);

                // userId로 사용자 조회 (이메일 문제 회피)
                Users user = usersRepository.findById(userId)
                        .orElseThrow(() -> {
                            log.error("❌ 사용자를 찾을 수 없습니다 - userId: {}", userId);
                            return new RuntimeException("사용자를 찾을 수 없습니다");
                        });

                log.info("✅ 사용자 조회 성공 - 이메일: {}, Role: {}", user.getEmail(), user.getRole());

                // 권한 설정 (ROLE_ 접두사 필수!)
                SimpleGrantedAuthority authority =
                        new SimpleGrantedAuthority("ROLE_" + user.getRole().name());

                // Principal을 userId(Long)로 설정
                UsernamePasswordAuthenticationToken authentication =
                        new UsernamePasswordAuthenticationToken(
                                userId,  // principal: userId (Long)
                                null,    // credentials
                                Collections.singletonList(authority)  // authorities - null 절대 안됨!
                        );

                // 요청 세부정보 설정
                authentication.setDetails(
                        new WebAuthenticationDetailsSource().buildDetails(request)
                );

                // SecurityContext에 저장
                SecurityContextHolder.getContext().setAuthentication(authentication);

                log.info("✅ SecurityContext 설정 완료 - Principal: {}, 권한: {}",
                        userId, authority.getAuthority());

            } else {
                log.debug("⚠️ 유효한 토큰이 없음");
            }

        } catch (Exception e) {
            log.error("❌ JWT 인증 처리 중 오류: {}", e.getMessage());
            log.error("상세 오류:", e);
            SecurityContextHolder.clearContext();
        }

        chain.doFilter(request, response);
    }

    /**
     * HTTP 헤더에서 JWT 토큰 추출
     */
    private String resolveToken(HttpServletRequest request) {
        String bearer = request.getHeader("Authorization");
        if (StringUtils.hasText(bearer) && bearer.startsWith("Bearer ")) {
            return bearer.substring(7);
        }
        return null;
    }
}