// src/main/java/com/we/hirehub/security/JwtUserPrincipal.java
package com.we.hirehub.config;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.User;

import java.util.Collection;

/** JWT에서 꺼낸 (email, uid, role)로 인증 컨텍스트에 넣기 위한 프린시펄 */
public class JwtUserPrincipal extends User {
    private final Long userId;
    private final String email;

    public JwtUserPrincipal(Long userId, String email, String role, Collection<? extends GrantedAuthority> auths) {
        super(email, "", auths);
        this.userId = userId;
        this.email = email;
    }

    public Long getUserId() { return userId; }
    public String getEmail() { return email; }
}
