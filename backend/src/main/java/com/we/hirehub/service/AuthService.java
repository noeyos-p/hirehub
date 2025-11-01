// src/main/java/com/we/hirehub/service/AuthService.java
package com.we.hirehub.service;

import com.we.hirehub.dto.SignupEmailRequest;
import com.we.hirehub.entity.Role;
import com.we.hirehub.entity.Users;
import com.we.hirehub.repository.UsersRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UsersRepository usersRepository;
    private final PasswordEncoder passwordEncoder;

    public Optional<Users> findByEmail(String email) {
        return usersRepository.findByEmail(email);
    }

    // [ADD] ✅ 일반 회원가입(이메일/비밀번호)
    // - 엔티티/DDL 변경 없이 동작
    // - 이메일 중복 검사 → 비밀번호 인코딩 → USER 롤로 저장
    public Users signupEmail(SignupEmailRequest req) {
        if (req == null || req.getEmail() == null || req.getEmail().isBlank()
                || req.getPassword() == null || req.getPassword().isBlank()) {
            throw new IllegalArgumentException("email/password is required");
        }

        usersRepository.findByEmail(req.getEmail()).ifPresent(u -> {
            throw new IllegalStateException("이미 사용 중인 이메일입니다.");
        });

        String encoded = passwordEncoder.encode(req.getPassword());

        Users u = Users.builder()
                .email(req.getEmail())
                .password(encoded)
                .role(Role.USER)          // 기본 USER
                .build();

        return usersRepository.save(u);
    }

    // [EXISTING] ✅ 소셜 신규 유저 생성 (password NOT NULL 제약 충족용 더미 비번)
    public Users createSocialUser(String provider, String email, String name) {
        String rawRandom = provider + "_" + UUID.randomUUID();
        String encoded = passwordEncoder.encode(rawRandom);

        Users u = Users.builder()
                .email(email)
                .name(name != null ? name : "")
                .password(encoded)           // NULL 금지 컬럼 충족
                .role(Role.USER)
                .build();

        return usersRepository.save(u);
    }

    // [EXISTING] ✅ 소셜 프로필에서 이메일 표준 추출
    public String resolveEmailFromOAuth(String provider, Map<String, Object> attrs) {
        try {
            switch (provider) {
                case "google":
                    return (String) attrs.get("email");
                case "kakao":
                    Map<String, Object> ka = (Map<String, Object>) attrs.get("kakao_account");
                    return ka != null ? (String) ka.get("email") : null;
                case "naver":
                    Map<String, Object> resp = (Map<String, Object>) attrs.get("response");
                    return resp != null ? (String) resp.get("email") : null;
                default:
                    return null;
            }
        } catch (Exception e) {
            log.warn("resolveEmailFromOAuth failed: {}", e.getMessage());
            return null;
        }
    }

    // [EXISTING] ✅ 소셜 프로필에서 이름 표준 추출
    public String resolveNameFromOAuth(String provider, Map<String, Object> attrs) {
        try {
            switch (provider) {
                case "google":
                    return (String) attrs.getOrDefault("name", "");
                case "kakao":
                    Map<String, Object> profile = (Map<String, Object>) ((Map<String, Object>) attrs.getOrDefault("kakao_account", Map.of()))
                            .getOrDefault("profile", Map.of());
                    return (String) profile.getOrDefault("nickname", "");
                case "naver":
                    Map<String, Object> resp = (Map<String, Object>) attrs.get("response");
                    return resp != null ? (String) resp.getOrDefault("name", "") : "";
                default:
                    return "";
            }
        } catch (Exception e) {
            log.warn("resolveNameFromOAuth failed: {}", e.getMessage());
            return "";
        }
    }
}
