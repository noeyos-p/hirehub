// src/main/java/com/we/hirehub/controller/OnboardingRestController.java
package com.we.hirehub.controller;

import com.we.hirehub.config.JwtTokenProvider;
import com.we.hirehub.dto.OnboardingForm;
import com.we.hirehub.entity.Users;
import com.we.hirehub.repository.UsersRepository;
import com.we.hirehub.service.OnboardingService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/onboarding")
@RequiredArgsConstructor
public class OnboardingRestController {

    private final OnboardingService onboardingService;
    private final JwtTokenProvider jwtTokenProvider;
    private final UsersRepository usersRepository;   // ✅ 추가됨

    /**
     * ✅ 온보딩 저장 엔드포인트
     * - SecurityContext에서 이메일 추출
     * - 서비스 저장 후 새 JWT 발급 (로그인 유지)
     */
    @PostMapping(
            value = "/save",
            consumes = MediaType.APPLICATION_JSON_VALUE,
            produces = MediaType.APPLICATION_JSON_VALUE
    )
    public ResponseEntity<?> save(@RequestBody OnboardingForm form) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();

        if (auth == null || auth.getName() == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of(
                            "error", "UNAUTHORIZED",
                            "message", "인증이 필요합니다."
                    ));
        }

        String email = auth.getName();
        log.debug("🎯 온보딩 요청 수신 - 이메일: {}", email);
        log.debug("📩 폼 내용: {}", form);

        try {
            // 1️⃣ 온보딩 데이터 저장
            onboardingService.save(email, form);
            log.debug("✅ 온보딩 저장 완료 - {}", email);

            // 2️⃣ 새 JWT 발급용 유저 조회
            Users user = usersRepository.findByEmail(email)
                    .orElseThrow(() -> new IllegalArgumentException("User not found: " + email));

            String newToken = jwtTokenProvider.createToken(user.getEmail(), user.getId());

            // 3️⃣ 응답
            return ResponseEntity.ok(Map.of(
                    "status", "OK",
                    "message", "온보딩이 완료되었습니다.",
                    "accessToken", newToken,
                    "tokenType", "Bearer"
            ));

        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of(
                            "error", "VALIDATION_ERROR",
                            "message", e.getMessage()
                    ));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of(
                            "error", "SERVER_ERROR",
                            "message", "서버 오류: " + e.getMessage()
                    ));
        }
    }
}
