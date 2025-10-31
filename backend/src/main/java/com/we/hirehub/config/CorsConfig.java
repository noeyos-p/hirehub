package com.we.hirehub.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.*;

import java.util.List;

@Configuration
public class CorsConfig {

    @Value("${app.cors.allowed-origins[0]:http://localhost:3000}")
    private String origin1;

    @Value("${app.cors.allowed-origins[1]:http://localhost:5173}")
    private String origin2;

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration c = new CorsConfiguration();
        // 테스트용
        /*c.setAllowedOriginPatterns(List.of("*"));*/
        c.setAllowedOriginPatterns(List.of(origin1, origin2));
        c.setAllowedMethods(List.of("GET","POST","PUT","PATCH","DELETE","OPTIONS"));
        c.setAllowedHeaders(List.of("*"));
        c.setAllowCredentials(true);
        c.addAllowedOrigin("http://localhost:3000");
        c.addAllowedMethod("*");
        c.addAllowedHeader("*");
        c.setAllowedOriginPatterns(List.of("*")); // 테스트용으로 모두 허용
        c.setAllowCredentials(true);
        c.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource s = new UrlBasedCorsConfigurationSource();
        s.registerCorsConfiguration("/**", c);
        return s;
    }
}
