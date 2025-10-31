package com.we.hirehub.config;

import com.we.hirehub.auth.OAuth2LoginHandler;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.ProviderManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

import java.util.List;

@Configuration
@RequiredArgsConstructor
public class SecurityConfig {

    @Value("${app.front.base-url:http://localhost:3000}")
    private String frontBaseUrl;

    private final UserDetailsService dbUserDetailsService;
    private final PasswordEncoder passwordEncoder;
    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final JwtAuthEntryPoint jwtAuthEntryPoint;
    private final OAuth2LoginHandler oAuth2LoginHandler;

    @Bean
    public DaoAuthenticationProvider daoAuthProvider() {
        DaoAuthenticationProvider p = new DaoAuthenticationProvider();
        p.setUserDetailsService(dbUserDetailsService);
        p.setPasswordEncoder(passwordEncoder);
        return p;
    }

    @Bean
    public AuthenticationManager authenticationManager(DaoAuthenticationProvider daoAuthProvider) {
        return new ProviderManager(List.of(daoAuthProvider));
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .cors(Customizer.withDefaults())
                .csrf(csrf -> csrf.disable())

                .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))

                .authorizeHttpRequests(auth -> auth

                        // WebSocket 엔드포인트 허용 추가
                        .requestMatchers("/ws/**").permitAll()
                        // 공개 API (인증 불필요)
                        .requestMatchers("/api/auth/**", "/error").permitAll()
                        .requestMatchers("/oauth2/**", "/login/oauth2/**").permitAll()

                        // 관리자 전용 API (ADMIN 권한 필요) - 순서가 중요!
                        .requestMatchers("/api/admin/**").hasRole("ADMIN")
                        .requestMatchers("/admin/**").hasRole("ADMIN")

                        // 나머지는 인증 필요
                        .anyRequest().authenticated()
                )

                .formLogin(login -> login.disable())

                // OAuth2 로그인
                .oauth2Login(oauth -> oauth
                        .successHandler(oAuth2LoginHandler)
                        .failureHandler(oAuth2LoginHandler)
                )

                .exceptionHandling(ex -> ex
                        .authenticationEntryPoint(jwtAuthEntryPoint)
                )

                // JWT 필터 추가
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}