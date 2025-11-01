// src/main/java/com/we/hirehub/auth/CustomOAuth2UserService.java
package com.we.hirehub.auth;

import com.we.hirehub.entity.Role;
import com.we.hirehub.entity.Users;
import com.we.hirehub.repository.UsersRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.DefaultOAuth2User;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;

/**
 * OAuth2 사용자 정보 로드 및 DB 저장/조회 처리
 *
 * ✅ 수정 사항:
 * 1. 사용자 생성 시 password에 UUID 더미값 설정 (NOT NULL 제약 해결)
 * 2. OAuth2User Attributes에 id, uid, email 저장 (userId 추출 가능)
 * 3. 상세한 로깅 추가 (디버깅 용이)
 * 4. 모든 OAuth 제공자(카카오, 네이버, 구글) 지원
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class CustomOAuth2UserService extends DefaultOAuth2UserService {

    private final UsersRepository usersRepository;

    @Override
    @Transactional
    public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
        // Spring의 기본 OAuth2UserService에서 사용자 정보 로드
        OAuth2User oAuth2User = super.loadUser(userRequest);

        // ✅ [수정] email을 final 변수로 추출 (람다식에서 사용 가능)
        String email = extractEmail(oAuth2User);

        if (email == null || email.isBlank()) {
            log.error("❌ OAuth2 사용자 이메일을 확인할 수 없습니다");
            throw new IllegalStateException("OAuth2 사용자 이메일을 확인할 수 없습니다.");
        }

        log.info("🔍 OAuth2 사용자 로드: {}", email);

        // ✅ [수정] DB에 사용자 저장/조회
        Users user = usersRepository.findByEmail(email).orElseGet(() -> {
            log.info("🆕 신규 OAuth2 사용자 생성: {}", email);

            Users newUser = new Users();
            newUser.setEmail(email);
            newUser.setRole(Role.USER);

            // ✅ [핵심 수정] password에 UUID 더미값 설정
            // OAuth 사용자는 비밀번호가 필요 없으므로 더미값으로 설정
            // Users 테이블의 password 컬럼이 NOT NULL 제약이므로 필수
            newUser.setPassword(UUID.randomUUID().toString());

            Users savedUser = usersRepository.save(newUser);
            log.info("✅ 신규 사용자 DB 저장 완료 - ID: {}", savedUser.getId());
            return savedUser;
        });

        log.info("✅ 사용자 정보 확정 - ID: {}, Email: {}", user.getId(), user.getEmail());

        // ✅ [수정] OAuth2User의 Attributes에 userId 정보 추가
        // userId()에서 getAttribute("id")로 추출할 수 있도록 설정
        Map<String, Object> attributes = new LinkedHashMap<>(oAuth2User.getAttributes());
        attributes.put("id", user.getId());        // userId를 "id" 키로 저장 (권장)
        attributes.put("uid", user.getId());       // 백업용 "uid" 키도 저장
        attributes.put("email", email);            // 이메일도 명시적으로 저장

        log.info("📦 OAuth2User Attributes 구성: id={}, uid={}, email={}",
                user.getId(), user.getId(), email);

        // DefaultOAuth2User 생성 (nameAttributeKey = "email")
        return new DefaultOAuth2User(
                oAuth2User.getAuthorities(),
                attributes,
                "email"  // Principal의 이름으로 email 사용
        );
    }

    /**
     * OAuth2User에서 이메일 추출
     * 카카오, 네이버, 구글 모두 지원
     *
     * @param oAuth2User OAuth2User 객체
     * @return 추출된 이메일 (null이면 찾지 못함)
     */
    private String extractEmail(OAuth2User oAuth2User) {
        // 1️⃣ 직접 email 속성 (구글, 네이버 - 직접 제공)
        String email = oAuth2User.getAttribute("email");
        if (email != null && !email.isBlank()) {
            log.debug("✅ 직접 email 속성에서 추출: {}", email);
            return email;
        }

        // 2️⃣ 카카오의 nested email (kakao_account.email)
        // 카카오는 Attributes 내부에 kakao_account 맵 안에 email이 있음
        Map<String, Object> kakaoAccount = oAuth2User.getAttribute("kakao_account");
        if (kakaoAccount != null) {
            Object kakaoEmail = kakaoAccount.get("email");
            if (kakaoEmail != null && !kakaoEmail.toString().isBlank()) {
                log.debug("✅ 카카오 kakao_account.email에서 추출: {}", kakaoEmail);
                return kakaoEmail.toString();
            }
        }

        // 3️⃣ 네이버의 response 내 email
        // 네이버는 Attributes 내부에 response 맵 안에 email이 있음
        Map<String, Object> naverResponse = oAuth2User.getAttribute("response");
        if (naverResponse != null) {
            Object naverEmail = naverResponse.get("email");
            if (naverEmail != null && !naverEmail.toString().isBlank()) {
                log.debug("✅ 네이버 response.email에서 추출: {}", naverEmail);
                return naverEmail.toString();
            }
        }

        // 이메일을 찾지 못한 경우 경고 로그
        log.warn("⚠️ 어느 경로에서도 이메일을 찾을 수 없음");
        log.warn("📋 Attributes 키 목록: {}", oAuth2User.getAttributes().keySet());

        return null;
    }
}