// src/main/java/com/we/hirehub/naverauth/NaverAuthService.java
package com.we.hirehub.naverauth;

import com.we.hirehub.config.JwtTokenProvider;
import com.we.hirehub.dto.common.AuthResult;
import com.we.hirehub.entity.Role;
import com.we.hirehub.entity.Users;
import com.we.hirehub.dto.common.NaverTokenResponse;
import com.we.hirehub.dto.common.NaverUserResponse;
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
    public AuthResult handleCallback(String code, NaverOAuthProperties props) {
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
        Users user = usersRepository.findByEmail(email).orElseGet(() -> {
            Users u = new Users();
            u.setEmail(email);
            u.setPassword("naver_user"); // dummy
            u.setRole(Role.USER);
            // Users 엔티티에 nickname이 있으면 저장 (없으면 무시)
            try {
                u.getClass().getMethod("setNickname", String.class);
                u.setNickname(nameOrEmail);
            } catch (NoSuchMethodException ignored) {}
            return usersRepository.save(u);
        });

        // 4) 온보딩 완료 여부 판단: 이메일, 이름, 전화번호, 닉네임이 모두 있으면 온보딩 완료
        boolean isOnboardingComplete = user.getEmail() != null
                && user.getName() != null && !user.getName().isBlank()
                && user.getPhone() != null && !user.getPhone().isBlank()
                && user.getNickname() != null && !user.getNickname().isBlank();

        boolean isNewUser = !isOnboardingComplete;

        // 5) JWT 발급
        String jwt = jwtTokenProvider.createToken(user.getEmail(), user.getId());

        // 6) 프론트로 토큰 전달
        return new AuthResult(jwt, email, isNewUser);
    }
}
