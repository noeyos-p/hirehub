package com.we.hirehub.controller.user;

import com.we.hirehub.dto.user.UsersDto;
import com.we.hirehub.dto.user.UsersRequestDto;
import com.we.hirehub.service.user.MyPageProfileService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@Slf4j
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/mypage")
public class MyPageProfileController extends BaseUserController  {

    private final MyPageProfileService myPageProfileService;

    /**
     * ✅ 내 프로필 조회 (온보딩 데이터)
     */
    @GetMapping("/me")
    public ResponseEntity<UsersDto.Profile> getMe(Authentication auth) {
        return ResponseEntity.ok(myPageProfileService.getProfile(userId(auth)));
    }

    /**
     * ✅ 내 프로필 수정
     */
    @PutMapping("/me")
    public ResponseEntity<UsersDto.Profile> updateMe(Authentication auth,
                                                     @Valid @RequestBody UsersRequestDto req) {
        return ResponseEntity.ok(myPageProfileService.updateProfile(userId(auth), req));
    }

    /**
     * ✅ 회원 탈퇴 (소프트삭제)
     */
    @DeleteMapping("/withdraw")
    public ResponseEntity<?> withdraw(Authentication auth) {
        if (auth == null || auth.getName() == null) {
            log.warn("🚨 인증되지 않은 탈퇴 요청");
            return ResponseEntity.status(401)
                    .body(Map.of("message", "로그인이 필요합니다."));
        }

        String email = auth.getName();
        log.info("🧹 회원 탈퇴 요청: {}", email);

        try {
            boolean result = myPageProfileService.softWithdrawUser(email);
            if (result) {
                return ResponseEntity.ok(Map.of("message", "회원 탈퇴가 완료되었습니다."));
            } else {
                return ResponseEntity.status(400).body(Map.of("message", "이미 탈퇴된 계정이거나 존재하지 않습니다."));
            }
        } catch (Exception e) {
            log.error("❌ 탈퇴 처리 중 오류: {}", e.getMessage(), e);
            return ResponseEntity.status(500).body(Map.of("message", "서버 오류로 탈퇴를 완료하지 못했습니다."));
        }
    }
}
