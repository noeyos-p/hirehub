package com.we.hirehub.controller;

import com.we.hirehub.dto.ApplyResponse;
import com.we.hirehub.service.ApplyService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/jobposts")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class ApplyRestController {

    private final ApplyService applyService;

    @PostMapping("/{jobPostId}/apply")
    public ResponseEntity<ApplyResponse> apply(Authentication auth,
                                               @PathVariable Long jobPostId,
                                               @RequestBody(required = false) ApplyRequest body) {
        Long userId = userId(auth);                  // MyPageRestController와 동일 패턴
        Long resumeId = (body != null) ? body.resumeId : null;
        return ResponseEntity.ok(applyService.apply(userId, jobPostId, resumeId));
    }

    /** 요청 바디 (선택) */
    public static class ApplyRequest {
        public Long resumeId; // optional
    }

    private Long userId(Authentication auth) {
        if (auth == null) {
            auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth == null) throw new IllegalStateException("인증 정보가 없습니다.");
        }
        Object p = auth.getPrincipal();
        if (p instanceof Long l) return l;
        if (p instanceof String s) {
            try { return Long.parseLong(s); } catch (NumberFormatException ignore) {}
        }
        try {
            var m = p.getClass().getMethod("getId");
            Object v = m.invoke(p);
            if (v instanceof Long l) return l;
            if (v instanceof String s) return Long.parseLong(s);
        } catch (Exception ignore) {}
        throw new IllegalStateException("현재 사용자 ID를 확인할 수 없습니다.");
    }
}
