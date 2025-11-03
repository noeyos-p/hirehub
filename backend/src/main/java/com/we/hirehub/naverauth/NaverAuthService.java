// src/main/java/com/we/hirehub/naverauth/NaverAuthService.java
package com.we.hirehub.naverauth;

import com.we.hirehub.config.JwtTokenProvider;
import com.we.hirehub.entity.Role;
import com.we.hirehub.entity.Users;
import com.we.hirehub.dto.NaverAuthResult;
import com.we.hirehub.dto.NaverTokenResponse;
import com.we.hirehub.dto.NaverUserResponse;
import com.we.hirehub.repository.UsersRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class NaverAuthService {

    private final NaverOAuthClient client;
    private final UsersRepository usersRepository;
    private final JwtTokenProvider jwtTokenProvider;

    @Transactional
    public NaverAuthResult handleCallback(String code, NaverOAuthProperties props) {
        // 1) 코드 → 토큰
        NaverTokenResponse token = client.exchangeCode(
                code,
                props.getClientId(),
                props.getClientSecret(),
                props.getRedirectUri()
        );

        // 2) 토큰으로 유저 조회
        NaverUserResponse userResp = client.fetchUser(token.getAccessToken());
        String email = userResp.getEmailOrFallback();
        String nameOrEmail = userResp.getNameOrEmail();

        // 3) 가입/조회
        Users user = usersRepository.findByEmail(email).orElse(null);
        boolean isNewUser = false;
        if (user == null) {
            user = new Users();
            user.setEmail(email);
            user.setPassword("naver_user"); // dummy
            user.setRole(Role.USER);
            // Users 엔티티에 nickname이 있으면 저장 (없으면 무시)
            try { user.getClass().getMethod("setNickname", String.class); user.setNickname(nameOrEmail); } catch (NoSuchMethodException ignored) {}
            user = usersRepository.save(user);
            isNewUser = true;
        }

        // 4) JWT 발급
        String jwt = jwtTokenProvider.createToken(user.getEmail(), user.getId());

        // 5) 프론트로 토큰 전달
        return new NaverAuthResult(jwt, email, isNewUser);
    }
}
