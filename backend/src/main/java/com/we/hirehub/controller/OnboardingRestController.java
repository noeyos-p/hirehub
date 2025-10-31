package com.we.hirehub.controller;

import com.we.hirehub.dto.OnboardingForm;
import com.we.hirehub.entity.Users;
import com.we.hirehub.repository.UsersRepository;
import com.we.hirehub.service.OnboardingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/onboarding")
@RequiredArgsConstructor
public class OnboardingRestController {

    private final OnboardingService onboardingService;
    private final UsersRepository usersRepository;

    @PostMapping(
            value = "/save",
            consumes = MediaType.APPLICATION_JSON_VALUE,
            produces = MediaType.APPLICATION_JSON_VALUE
    )
    public ResponseEntity<?> save(
            Authentication authentication,
            @Valid @RequestBody OnboardingForm form
    ) {
        // 🔒 인증 확인
        if (authentication == null || !(authentication.getPrincipal() instanceof Long userId)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of(
                            "error", "UNAUTHORIZED",
                            "message", "인증이 필요합니다."
                    ));
        }

        try {
            // 사용자 조회
            Users user = usersRepository.findById(userId)
                    .orElseThrow(() -> new IllegalArgumentException("User not found"));

            // 온보딩 정보 저장 시도
            onboardingService.save(user.getEmail(), form);

            // 성공 응답
            return ResponseEntity.ok(Map.of(
                    "status", "OK",
                    "message", "온보딩이 완료되었습니다."
            ));

        } catch (IllegalArgumentException e) {
            // 중복 닉네임, 중복 전화번호 등
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of(
                            "error", "VALIDATION_ERROR",
                            "message", e.getMessage()
                    ));

        } catch (Exception e) {
            // 기타 서버 오류
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of(
                            "error", "SERVER_ERROR",
                            "message", "서버 오류가 발생했습니다: " + e.getMessage()
                    ));
        }
    }
}
