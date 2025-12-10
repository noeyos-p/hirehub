package com.we.hirehub.config;

import com.we.hirehub.auth.CustomOAuth2UserService;
import com.we.hirehub.auth.OAuth2LoginHandler;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfigurationSource;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final OAuth2LoginHandler oAuth2LoginHandler;
    private final CustomOAuth2UserService customOAuth2UserService;
    private final JwtTokenProvider tokenProvider;
    private final CorsConfigurationSource corsConfigurationSource;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .csrf(csrf -> csrf.disable())
                .cors(cors -> cors.configurationSource(corsConfigurationSource))
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS)) // ✅ 추가
                .headers(h -> h.frameOptions(f -> f.sameOrigin()))
                .authorizeHttpRequests(auth -> auth
                        // ✅ 인증 없이 접근 가능한 경로
                        .requestMatchers(
                                "/api/board/ai/**", // AI 게시글 자동생성
                                "/api/ai/**",           // AI 챗봇 API
                                "/api/sms/**", //문자인증
                                "/api/resume/match", // 👈 공개 허용
                                "/health",              // 헬스체크
                                "/ws/**",
                                "/api/faq/**",          // ✅ FAQ API (수정됨!)
                                "/api/chatbot/**", // ✅ 챗봇 관련 API
                                "/api/resume/match",  // ← 이거 추가
                                "/api/chatbot/faq", "/api/chatbot/faq/**",
                                "/api/faq", "/api/faq/**",  // ✅ FAQ API 접근 허용 추가
                                "/api/ads",  // ✅ 일반 사용자 광고 조회 추가
                                "/api/auth/**",
                                "/api/public/**",
                                // ❌ "/api/onboarding/**", 제거! 인증 필요
                                "/api/jobposts/**",
                                "/api/company/**",
                                "/api/companies/**",
                                "/api/reviews/company/**",
                                "/", "/error",
                                "/favicon.ico", "/css/**", "/js/**", "/images/**",
                                "/swagger-ui/**", "/v3/api-docs/**",
                                "/actuator/**",
                                "/login/**", "/oauth2/**",
                                "/google", "/kakao", "/naver",
                                "/api/mypage/resumes/**",
                                "/naver/**", "/kakao/**", "/google/**"
                        ).permitAll()

                        // ✅ 게시판: 조회만 허용, 나머지는 인증 필요
                        .requestMatchers(HttpMethod.GET, "/api/board/**").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/board/**").authenticated()
                        .requestMatchers(HttpMethod.PUT, "/api/board/**").authenticated()
                        .requestMatchers(HttpMethod.DELETE, "/api/board/**").authenticated()

                        // ✅ 댓글: 조회만 허용, 나머지는 인증 필요
                        .requestMatchers(HttpMethod.GET, "/api/comment/**").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/comment/**").authenticated()
                        .requestMatchers(HttpMethod.PUT, "/api/comment/**").authenticated()
                        .requestMatchers(HttpMethod.DELETE, "/api/comment/**").authenticated()

                        // ✅ 그 외 모든 요청은 인증 필요
                        .anyRequest().authenticated()
                )
                .oauth2Login(oauth -> oauth
                        .loginPage("/login")
                        .userInfoEndpoint(ui -> ui.userService(customOAuth2UserService))
                        .successHandler(oAuth2LoginHandler)
                        .failureHandler(oAuth2LoginHandler)
                );

        // ✅ JWT 필터 추가
        http.addFilterBefore(new JwtAuthenticationFilter(tokenProvider), UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
