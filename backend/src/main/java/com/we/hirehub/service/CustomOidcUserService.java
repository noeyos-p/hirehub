package com.we.hirehub.service;

import com.we.hirehub.entity.Role;
import com.we.hirehub.entity.Users;
import com.we.hirehub.repository.UsersRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.client.oidc.userinfo.OidcUserRequest;
import org.springframework.security.oauth2.client.oidc.userinfo.OidcUserService;
import org.springframework.security.oauth2.core.oidc.user.DefaultOidcUser;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;
import java.util.Optional;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class CustomOidcUserService extends OidcUserService {

    private final UsersRepository usersRepository;

    @Override
    @Transactional
    public OidcUser loadUser(OidcUserRequest userRequest) {
        // 구글에서 사용자 정보 로드
        OidcUser oidcUser = super.loadUser(userRequest);

        Map<String, Object> attr = oidcUser.getAttributes();
        String email = String.valueOf(attr.get("email"));

        Users user = usersRepository.findByEmail(email).orElseGet(() -> {
            Users u = new Users();
            u.setEmail(email);
            u.setRole(Role.USER);
            u.setPassword("google_user");  // [ADDED] 더미 비번 (NOT NULL 제약 회피)
            return usersRepository.save(u);
        });

        // 필요 시 권한 세팅 유지
        Set<GrantedAuthority> authorities = Set.of(new SimpleGrantedAuthority("ROLE_" + user.getRole().name()));
        return new DefaultOidcUser(authorities, oidcUser.getIdToken(), oidcUser.getUserInfo());
    }


    // Users에 setUsername 이 있는지 여부를 판단하기 위한 보조 (리플렉션 없이 컴파일 안전하게 주석 대안 제시용)
    private boolean hasMethodSetUsername(Users u) {
        try {
            u.getClass().getMethod("setUsername", String.class);
            return true;
        } catch (NoSuchMethodException e) {
            return false;
        }
    }
}
