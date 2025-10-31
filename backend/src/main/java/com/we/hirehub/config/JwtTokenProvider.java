package com.we.hirehub.config;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.util.Date;
import java.util.Map;

@Component
public class JwtTokenProvider {

    private final Key key;
    private final long accessTokenMillis;

    public JwtTokenProvider(
            @Value("${app.jwt.secret}") String secret,
            @Value("${app.jwt.access-expire-seconds:3600}") long accessExpireSeconds
    ) {
        this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.accessTokenMillis = accessExpireSeconds * 1000L;
    }

    /** username(email) + userId를 받아 토큰 발급 */
    public String createToken(String username, Long userId) {
        Date now = new Date();
        Date exp = new Date(now.getTime() + accessTokenMillis);

        return Jwts.builder()
                .setSubject(username)             // email
                .addClaims(Map.of("uid", userId)) // ★ userId 클레임
                .setIssuedAt(now)
                .setExpiration(exp)
                .signWith(key, SignatureAlgorithm.HS256)
                .compact();
    }

    /** (기존 Authentication만 넘어오는 경우가 있으면 보조용) */
    public String createToken(Authentication authentication, Long userId) {
        String username = (authentication.getPrincipal() instanceof UserDetails d)
                ? d.getUsername()
                : String.valueOf(authentication.getPrincipal());
        return createToken(username, userId);
    }

    public boolean validate(String token) {
        try {
            Jwts.parserBuilder().setSigningKey(key).build().parseClaimsJws(token);
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            return false;
        }
    }

    public String getUsername(String token) {
        return getClaims(token).getSubject();
    }

    public Long getUserId(String token) {
        Object v = getClaims(token).get("uid");
        if (v instanceof Number n) return n.longValue();
        if (v instanceof String s) return Long.parseLong(s);
        return null;
    }

    private Claims getClaims(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(key)
                .build()
                .parseClaimsJws(token)
                .getBody();
    }

    public String getEmailFromToken(String token) {
        Claims claims = Jwts.parserBuilder()
                .setSigningKey(key)
                .build()
                .parseClaimsJws(token)
                .getBody();
        return claims.getSubject();
    }

    public boolean validateToken(String token) {
        try {
            Jwts.parserBuilder().setSigningKey(key).build().parseClaimsJws(token);
            return true;
        } catch (Exception e) {
            return false;
        }
    }
}
