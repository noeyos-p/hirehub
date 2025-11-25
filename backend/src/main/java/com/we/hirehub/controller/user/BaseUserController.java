package com.we.hirehub.controller.user;

import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.core.user.OAuth2User;

@Slf4j
public abstract class BaseUserController {

    protected Long userId(Authentication auth) {
        if (auth == null) {
            auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth == null)
                throw new IllegalStateException("인증 정보가 없습니다.");
        }

        Object p = auth.getPrincipal();
        log.debug("🔍 Principal 분석: 타입={}, 값={}",
                p != null ? p.getClass().getSimpleName() : "null", p);

        // 1. JwtUserPrincipal
        if (p instanceof com.we.hirehub.config.JwtUserPrincipal jwt) {
            Long userId = jwt.getUserId();
            log.debug("✅ JwtUserPrincipal userId = {}", userId);
            return userId;
        }

        // 2. OAuth2User
        if (p instanceof OAuth2User oauth2User) {
            Object idObj = oauth2User.getAttribute("id");
            if (idObj == null) idObj = oauth2User.getAttribute("uid");

            Long userId = convertToLong(idObj);
            if (userId != null) {
                log.debug("✅ OAuth2User userId = {}", userId);
                return userId;
            }

            log.warn("⚠ OAuth2User에서 id/uid 찾기 실패");
        }

        // 3. Long 그대로
        if (p instanceof Long l) return l;

        // 4. String을 Long으로 변환
        if (p instanceof String s) {
            try { return Long.parseLong(s); }
            catch (NumberFormatException ignored) {}
        }

        // 5. Spring Security User
        if (p instanceof org.springframework.security.core.userdetails.User user) {
            try { return Long.parseLong(user.getUsername()); }
            catch (NumberFormatException ignored) {}
        }

        // 6. getId() 리플렉션
        try {
            var m = p.getClass().getMethod("getId");
            Object v = m.invoke(p);
            return convertToLong(v);
        } catch (Exception ignored) {}

        throw new IllegalStateException("현재 사용자 ID를 확인할 수 없습니다.");
    }

    protected Long convertToLong(Object obj) {
        if (obj instanceof Number n) return n.longValue();
        if (obj instanceof String s) {
            try { return Long.parseLong(s); }
            catch (NumberFormatException ignored) {}
        }
        return null;
    }
}
