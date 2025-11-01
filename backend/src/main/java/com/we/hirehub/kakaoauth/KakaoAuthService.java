package com.we.hirehub.kakaoauth;

import com.we.hirehub.config.JwtTokenProvider;
import com.we.hirehub.dto.KakaoAuthResult;
import com.we.hirehub.dto.KakaoTokenResponse;
import com.we.hirehub.dto.KakaoUserResponse;
import com.we.hirehub.entity.Role;
import com.we.hirehub.entity.Users;
import com.we.hirehub.repository.UsersRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class KakaoAuthService {

    private final KakaoOAuthClient kakaoClient;
    private final UsersRepository usersRepository;
    private final JwtTokenProvider jwtTokenProvider;

    /**
     * 인가코드 -> 카카오 토큰 -> 카카오 사용자 조회 -> (회원 생성/업데이트) -> JWT 발급
     * 그리고 프론트 분기용으로 isNewUser까지 함께 리턴
     */
    @Transactional
    public KakaoAuthResult handleCallback(String code, KakaoOAuthProperties props) {
        // 1) 인가코드로 토큰 교환
        KakaoTokenResponse token = kakaoClient.exchangeToken(code, props);

        // 2) 카카오 사용자 정보 조회
        KakaoUserResponse userInfo = kakaoClient.fetchUser(token.getAccessToken());
        String email = userInfo.getEmailOrFallback();        // 이메일은 반드시 확보
        if (email == null || email.isBlank()) {
            // 카카오에서 이메일 동의 안 했을 때 등
            throw new IllegalStateException("카카오 계정 이메일을 확인할 수 없습니다.");
        }

        // 3) 신규 여부 판단
        boolean isNewUser = !usersRepository.existsByEmail(email);

        // 4) 사용자 생성/조회 (엔티티 구조 안건드림: email/role만 안전 세팅)
        Users user = usersRepository.findByEmail(email).orElseGet(() -> {
            Users u = new Users();
            u.setEmail(email);
            u.setRole(Role.USER);      // 기본 USER
            return usersRepository.save(u);
        });

        // 5) JWT 발급 (프로젝트의 JwtTokenProvider 시그니처에 맞춰)
        //    - 네 프로젝트는 이미 createToken(email, userId)로 맞춰서 동작 중
        String jwt = jwtTokenProvider.createToken(user.getEmail(), user.getId());

        // 6) 프론트 콜백에서 쿼리로 token & isNewUser 넘길 수 있게 패키징
        return new KakaoAuthResult(jwt, email, isNewUser);
    }

    /** 수동(독립) 인가 링크 필요 시 */
    public String buildAuthorizeUrl(KakaoOAuthProperties props) {
        return "https://kauth.kakao.com/oauth/authorize"
                + "?response_type=code"
                + "&client_id=" + props.getClientId()
                + "&redirect_uri=" + props.getRedirectUri()
                + "&scope=profile_nickname%20account_email";
    }
}
