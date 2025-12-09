package com.we.hirehub.controller.common;

import com.we.hirehub.config.JwtTokenProvider;
import com.we.hirehub.dto.common.SignupAndLoginDto;
import com.we.hirehub.entity.Users;
import com.we.hirehub.repository.UsersRepository;
import com.we.hirehub.service.common.AuthService;
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

    @Value("${app.front.base-url}")
    private String frontendUrl;

    /**
     * 일반 로그인 (이메일/비밀번호)
     * POST /api/auth/login
     */
    @PostMapping("/login")
    public ResponseEntity<Map<String, Object>> login(@RequestBody SignupAndLoginDto request) {
        try {
            log.info("로그인 시도: {}", request.getEmail());

            // 1. 인증
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword()));

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
                    "role", user.getRole().name(), // ← ADMIN 또는 USER
                    "email", user.getEmail(),
                    "userId", user.getId(),
                    "requiresOnboarding", false // 로그인은 온보딩 불필요
            );

            log.info("✅ 로그인 완료 - 이메일: {}, Role: {}", user.getEmail(), user.getRole());

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("❌ 로그인 실패: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of(
                            "success", false,
                            "message", "이메일 또는 비밀번호가 올바르지 않습니다."));
        }
    }

    /**
     * 일반 회원가입 (이메일/비밀번호)
     * POST /api/auth/signup
     */
    @PostMapping("/signup")
    public ResponseEntity<Map<String, String>> signup(@Valid @RequestBody SignupAndLoginDto request) {
        try {
            // [FIX] 클래스명이 아니라, 실제 파라미터 변수 request 를 전달해야 함
            authService.signupEmail(request); // ← 여기만 수정

            // 회원가입 후 자동 로그인 처리
            Users user = usersRepository.findByEmail(request.getEmail())
                    .orElseThrow(() -> new IllegalArgumentException("User not found"));

            String accessToken = tokenProvider.createToken(
                    user.getEmail(),
                    user.getId(),
                    user.getRole().name());

            return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                    "tokenType", "Bearer",
                    "accessToken", accessToken,
                    "role", user.getRole().name(),
                    "message", "회원가입이 완료되었습니다. 내정보를  기입해주세요.",
                    "requiresOnboarding", "true"));
        } catch (Exception e) {
            log.error("❌ 회원가입 실패: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of(
                            "message", "회원가입 실패: " + e.getMessage()));
        }
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
    public ResponseEntity<?> me(
            Authentication authentication,
            @RequestHeader(value = "Authorization", required = false) String authz) {
        try {
            String email = null;

            // 1) Authentication에서 이메일 추출
            if (authentication != null) {
                email = authentication.getName();
            }

            // 2) fallback: JWT 직접 파싱
            if (email == null && authz != null && authz.startsWith("Bearer ")) {
                String token = authz.substring(7);
                if (tokenProvider.validate(token)) {
                    email = tokenProvider.getEmail(token);
                }
            }

            if (email == null) {
                return ResponseEntity.status(401).body(Map.of("message", "UNAUTHORIZED"));
            }

            Users u = authService.findByEmail(email).orElse(null);
            if (u == null) {
                return ResponseEntity.status(401).body(Map.of("message", "USER_NOT_FOUND"));
            }

            // ⭐⭐⭐ BOT 계정은 온보딩 체크 없이 바로 인증 처리 ⭐⭐⭐
            if (u.getRole() != null && u.getRole().name().equals("BOT")) {
                return ResponseEntity.ok(Map.of(
                        "id", u.getId(),
                        "email", u.getEmail(),
                        "role", u.getRole().name()));
            }

            // ⭐ USER/ADMIN 은 기존 로직 유지
            return ResponseEntity.ok(Map.of(
                    "id", u.getId(),
                    "email", u.getEmail(),
                    "name", u.getName(),
                    "role", u.getRole() != null ? u.getRole().name() : "USER"));

        } catch (Exception e) {
            return ResponseEntity.status(401).body(Map.of("message", "INVALID_TOKEN"));
        }
    }

    /**
     * 이메일 중복 확인
     * GET /api/auth/check-email?email={email}
     */
    @GetMapping("/check-email")
    public ResponseEntity<Map<String, String>> checkEmail(@RequestParam String email) {
        boolean exists = usersRepository.findByEmail(email).isPresent();
        if (exists) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("message", "이미 사용 중인 이메일입니다."));
        }
        return ResponseEntity.ok(Map.of("message", "사용 가능한 이메일입니다."));
    }

    /**
     * 닉네임 중복 확인
     * GET /api/auth/check-nickname?nickname={nickname}
     */
    @GetMapping("/check-nickname")
    public ResponseEntity<Map<String, String>> checkNickname(@RequestParam String nickname) {
        boolean exists = usersRepository.findByNickname(nickname).isPresent();
        if (exists) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("message", "이미 사용 중인 닉네임입니다."));
        }
        return ResponseEntity.ok(Map.of("message", "사용 가능한 닉네임입니다."));
    }

    private static boolean isBlank(String s) {
        return s == null || s.isBlank();
    }

    private boolean requiresOnboarding(Users u) {
        return isBlank(u.getName())
                || isBlank(u.getNickname())
                || isBlank(u.getPhone())
                || u.getDob() == null // 네 프로젝트에선 String/LocalDate 혼용했더라. null만 체크.
                || u.getGender() == null
                || isBlank(u.getAddress())
                || isBlank(u.getLocation())
                || isBlank(u.getPosition())
                || isBlank(u.getCareerLevel())
                || isBlank(u.getEducation());
    }
}