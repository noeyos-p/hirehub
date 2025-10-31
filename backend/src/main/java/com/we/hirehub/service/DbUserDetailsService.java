// src/main/java/com/we/hirehub/security/DbUserDetailsService.java
package com.we.hirehub.service;

import com.we.hirehub.entity.Users;
import com.we.hirehub.repository.UsersRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.*;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class DbUserDetailsService implements UserDetailsService {

    private final UsersRepository usersRepository;

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        // username == email 로 사용
        Users u = usersRepository.findByEmail(username)
                .orElseThrow(() -> new UsernameNotFoundException("user not found"));

        // ROLE_ 접두어로 권한 매핑
        String roleName = u.getRole() != null ? u.getRole().name() : "USER";
        List<GrantedAuthority> auths = List.of(new SimpleGrantedAuthority("ROLE_" + roleName));

        return User.withUsername(u.getEmail())
                .password(u.getPassword()) // 반드시 인코딩된 해시여야 함
                .authorities(auths)
                .accountExpired(false)
                .accountLocked(false)
                .credentialsExpired(false)
                .disabled(false)
                .build();
    }
}
