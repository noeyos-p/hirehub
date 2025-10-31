package com.we.hirehub.controller;

import com.we.hirehub.config.JwtTokenProvider;
import com.we.hirehub.dto.LoginRequest;
import com.we.hirehub.dto.SignupEmailRequest;
import com.we.hirehub.entity.Users;
import com.we.hirehub.repository.UsersRepository;
import com.we.hirehub.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * 인증 관련 REST API 컨트롤러
 * - 일반 로그인/회원가입 (이메일/비밀번호)
 * - OAuth2 구글 로그인/회원가입
 * - 현재 사용자 정보 조회
 */
@Slf4j
@RequiredArgsConstructor
@RestController
@RequestMapping("/api/auth")
public class AuthRestController {

    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider tokenProvider;
    private final UsersRepository usersRepository;
    private final AuthService authService;

    @Value("${app.frontend.url:http://localhost:3000}")
    private String frontendUrl;

    /**
     * 일반 로그인 (이메일/비밀번호)
     * POST /api/auth/login
     */
    @PostMapping("/login")
    public ResponseEntity<Map<String, Object>> login(@RequestBody LoginRequest request) {
        try {
            log.info("로그인 시도: {}", request.getEmail());

            // 1. 인증
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
            );

            log.info("인증 성공: {}", request.getEmail());

            // 2. 사용자 정보 조회
            Users user = usersRepository.findByEmail(request.getEmail())
                    .orElseThrow(() -> new IllegalArgumentException("User not found"));

            log.info("사용자 조회 성공 - ID: {}, Role: {}", user.getId(), user.getRole());

            // 3. JWT 토큰 생성
            String accessToken = tokenProvider.createToken(request.getEmail(), user.getId());

            // 4. 응답 생성 (role 추가!)
            Map<String, Object> response = Map.of(
                    "success", true,
                    "tokenType", "Bearer",
                    "accessToken", accessToken,
                    "role", user.getRole().name(),  // ← ADMIN 또는 USER
                    "email", user.getEmail(),
                    "userId", user.getId(),
                    "requiresOnboarding", false  // 로그인은 온보딩 불필요
            );

            log.info("✅ 로그인 완료 - 이메일: {}, Role: {}", user.getEmail(), user.getRole());

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("❌ 로그인 실패: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of(
                            "success", false,
                            "message", "이메일 또는 비밀번호가 올바르지 않습니다."
                    ));
        }
    }

    /**
     * 일반 회원가입 (이메일/비밀번호)
     * POST /api/auth/signup
     */
    @PostMapping("/signup")
    public ResponseEntity<Map<String, String>> signup(@Valid @RequestBody SignupEmailRequest request) {
        authService.signupMinimal(request);

        // 회원가입 후 자동 로그인 처리
        Users user = usersRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        String accessToken = tokenProvider.createToken(user.getEmail(), user.getId());

        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                "tokenType", "Bearer",
                "accessToken", accessToken,
                "role", user.getRole().name(),  // ← 회원가입에도 role 추가
                "message", "회원가입이 완료되었습니다. 온보딩을 진행해주세요.",
                "requiresOnboarding", "true"
        ));
    }

    /**
     * 구글 OAuth2 로그인/회원가입 시작
     * GET /api/auth/google
     *
     * React에서 이 URL로 이동하면 구글 로그인 페이지로 리다이렉트
     * 성공 시: 프론트엔드의 /auth/callback?token=JWT&isNewUser=true 로 리다이렉트
     * 실패 시: 프론트엔드의 /login?error=에러메시지 로 리다이렉트
     */
    @GetMapping("/google")
    public void googleLogin(jakarta.servlet.http.HttpServletResponse response) throws java.io.IOException {
        // Spring Security OAuth2 엔드포인트로 리다이렉트
        // 이후 OAuth2LoginHandler가 자동으로 처리
        response.sendRedirect("/oauth2/authorization/google");
    }

    /**
     * 현재 로그인한 사용자 정보 조회
     * GET /api/auth/me
     * Authorization: Bearer {JWT_TOKEN}
     */
    @GetMapping("/me")
    public ResponseEntity<Map<String, Object>> me(Authentication authentication) {
        // JWT 필터에서 Principal을 userId(Long)로 설정했음
        if (authentication == null || !(authentication.getPrincipal() instanceof Long userId)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of(
                            "error", "UNAUTHORIZED",
                            "message", "인증이 필요합니다."
                    ));
        }

        // userId로 실제 사용자 정보 조회
        Users user = usersRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        // 온보딩 완료 여부 판단 (null 체크 추가)
        boolean requiresOnboarding = user.getName() == null || user.getName().isBlank()
                || user.getPhone() == null || user.getPhone().isBlank()
                || user.getDob() == null || user.getDob().equals("1970-01-01")
                || user.getGender() == null || user.getGender().equals("UNKNOWN");

        return ResponseEntity.ok(Map.of(
                "id", user.getId(),
                "email", user.getEmail(),
                "name", user.getName() != null ? user.getName() : "",
                "nickname", user.getNickname() != null ? user.getNickname() : "",
                "phone", user.getPhone() != null ? user.getPhone() : "",
                "role", user.getRole().toString(),
                "requiresOnboarding", requiresOnboarding
        ));
    }
}