package com.we.hirehub.config;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.security.Key;
import java.util.Date;

@Slf4j
@Component
public class JwtTokenProvider {

    @Value("${app.jwt.secret}")
    private String secretKey;

    private Key key;

    @PostConstruct
    public void init() {
        this.key = Keys.hmacShaKeyFor(secretKey.getBytes());
    }

    // ✅ 토큰 생성 (로그인/소셜 통합용)
    public String createToken(String email, Long userId) {
        Date now = new Date();
        Date expiry = new Date(now.getTime() + (1000L * 60 * 60 * 24)); // 24시간

        return Jwts.builder()
                .setSubject(email)
                .claim("id", userId)
                .setIssuedAt(now)
                .setExpiration(expiry)
                .signWith(key, SignatureAlgorithm.HS256)
                .compact();
    }

    // ✅ 토큰 유효성 검사
    public boolean validate(String token) {
        try {
            Jwts.parserBuilder().setSigningKey(key).build().parseClaimsJws(token);
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            log.warn("❌ JWT 검증 실패: {}", e.getMessage());
            return false;
        }
    }

    public Long getUserId(String token) {
        try {
            Claims claims = Jwts.parserBuilder().setSigningKey(key).build()
                    .parseClaimsJws(token).getBody();
            Object idObj = claims.get("id");
            if (idObj instanceof Integer i) return i.longValue();
            if (idObj instanceof Long l) return l;
            if (idObj instanceof String s) return Long.parseLong(s);
            return null;
        } catch (Exception e) {
            log.error("❌ getUserId 실패: {}", e.getMessage());
            return null;
        }
    }


    // ✅ 이메일(Subject) 가져오기
    public String getUsername(String token) {
        try {
            Claims claims = Jwts.parserBuilder().setSigningKey(key).build()
                    .parseClaimsJws(token).getBody();
            return claims.getSubject();
        } catch (Exception e) {
            log.error("❌ getUsername 실패: {}", e.getMessage());
            return null;
        }
    }
    public String getEmail(String token) {
        return getUsername(token);
    }
}
