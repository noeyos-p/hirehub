package com.we.hirehub.config;

import com.we.hirehub.auth.CustomOAuth2UserService;
import com.we.hirehub.auth.OAuth2LoginHandler;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final OAuth2LoginHandler oAuth2LoginHandler;
    private final CustomOAuth2UserService customOAuth2UserService;
    private final JwtTokenProvider tokenProvider;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .csrf(csrf -> csrf.disable())
                .cors(cors -> {})
                .headers(h -> h.frameOptions(f -> f.sameOrigin()))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(
                                "/", "/error",
                                "/favicon.ico", "/css/**", "/js/**", "/images/**",
                                "/swagger-ui/**", "/v3/api-docs/**",
                                "/actuator/**",
                                "/login/**", "/oauth2/**",
                                "/google", "/kakao", "/naver",
                                "/naver/**", "/kakao/**", "/google/**",
                                "/api/auth/**",
                                "/api/onboarding/**",   // ✅ 온보딩 요청 허용
                                "/api/board/popular",
                                "/api/jobposts/**"
                        ).permitAll()
                        .requestMatchers(HttpMethod.GET, "/").permitAll()
                        .anyRequest().authenticated()
                )
                .oauth2Login(oauth -> oauth
                        .loginPage("/login")
                        .userInfoEndpoint(ui -> ui.userService(customOAuth2UserService))
                        .successHandler(oAuth2LoginHandler)
                        .failureHandler(oAuth2LoginHandler)
                );

        http.addFilterBefore(new JwtAuthenticationFilter(tokenProvider), UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }
}
