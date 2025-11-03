// src/main/java/com/we/hirehub/controller/OnboardingRestController.java
package com.we.hirehub.controller;

import com.we.hirehub.dto.OnboardingForm;
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

    /**
     * ✅ 온보딩 저장 엔드포인트
     * - 중복 매핑 제거
     * - SecurityContext에서 이메일 추출
     * - 서비스로 전달
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
            onboardingService.save(email, form);
            log.debug("✅ 온보딩 저장 완료 - {}", email);

            return ResponseEntity.ok(Map.of(
                    "status", "OK",
                    "message", "온보딩이 완료되었습니다."
            ));
        } catch (IllegalArgumentException e) {
            // 닉네임/전화번호 중복 등
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
