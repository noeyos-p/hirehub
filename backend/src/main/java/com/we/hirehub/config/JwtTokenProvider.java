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

    // ===============================
    // 🔥 [A] 기본 createToken (2 파라미터) — 기존 코드 호환 유지
    // ===============================
    public String createToken(String email, Long userId) {
        // 기본 role=USER 또는 null-safe → USER 처리
        return createToken(email, userId, "USER");
    }

    // ===============================
    // 🔥 [B] role 포함 createToken (신규)
    // ===============================
    public String createToken(String email, Long userId, String roleValue) {
        Date now = new Date();
        Date expiry = new Date(now.getTime() + (1000L * 60 * 60 * 24)); // 24시간

        return Jwts.builder()
                .setSubject(email)
                .claim("id", userId)
                .claim("role", roleValue)  // USER / ADMIN / BOT
                .setIssuedAt(now)
                .setExpiration(expiry)
                .signWith(key, SignatureAlgorithm.HS256)
                .compact();
    }

    // ===============================
    // 🔥 BOT 전용 토큰
    // ===============================
    public String createBotToken(Long userId) {
        return createToken("bot@bot", userId, "BOT");
    }

    // ===============================
    // 🔍 토큰 검증
    // ===============================
    public boolean validate(String token) {
        try {
            Jwts.parserBuilder().setSigningKey(key).build().parseClaimsJws(token);
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            log.warn("❌ JWT 검증 실패: {}", e.getMessage());
            return false;
        }
    }

    // ===============================
    // 🔍 userId 추출
    // ===============================
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

    // ===============================
    // 🔍 email(subject) 가져오기
    // ===============================
    public String getEmail(String token) {
        try {
            Claims claims = Jwts.parserBuilder().setSigningKey(key).build()
                    .parseClaimsJws(token).getBody();
            return claims.getSubject();
        } catch (Exception e) {
            log.error("❌ getEmail 실패: {}", e.getMessage());
            return null;
        }
    }
}
