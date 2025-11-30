// src/main/java/com/example/hirehub/admin/AdminChatController.java
package com.we.hirehub.controller.admin;

import com.we.hirehub.dto.support.HelpDto;
import com.we.hirehub.service.support.HelpService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@Slf4j
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/admin/support")
public class AdminChatController {

    private final HelpService helpService;

    /**
     * ✅ 미처리 상담 요청 조회
     * 관리자가 로그인 시 이전에 요청된 미처리 상담들을 조회
     */
    @GetMapping("/pending")
    public ResponseEntity<?> getPendingRequests(
            org.springframework.security.core.Authentication authentication
    ) {
        log.info("=== 미처리 상담 요청 조회 ===");

        // ✅ 관리자 체크 (이메일 기반)
        if (authentication == null || !authentication.isAuthenticated()) {
            log.warn("❌ 인증되지 않은 요청");
            return ResponseEntity.status(401).body("로그인이 필요합니다");
        }

        String email = authentication.getName();
        log.info("요청자: {}", email);

        if (!"admin@admin".equals(email)) {
            log.warn("❌ 관리자가 아닌 사용자의 접근 시도: {}", email);
            return ResponseEntity.status(403).body("관리자만 접근 가능합니다");
        }

        List<HelpDto> pendingRequests = helpService.getPendingRequests();
        log.info("✅ 미처리 상담 요청 {}건 조회됨", pendingRequests.size());
        return ResponseEntity.ok(pendingRequests);
    }
}
