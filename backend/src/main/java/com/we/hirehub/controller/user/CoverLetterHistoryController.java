package com.we.hirehub.controller.user;

import com.we.hirehub.dto.support.SaveCoverLetterRequest;
import com.we.hirehub.repository.UsersRepository;
import com.we.hirehub.service.support.CoverLetterHistoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/cover-letter/history")
public class CoverLetterHistoryController {

    private final CoverLetterHistoryService service;
    private final UsersRepository usersRepository;

    private Long resolveUserId(UserDetails user) {

        // 🔥 토큰 없이 접근 허용 (개발임시)
        if (user == null) return 1L; // 임시 userId=1

        String email = user.getUsername();
        return usersRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("유저 없음"))
                .getId();
    }

    @PostMapping
    public ResponseEntity<?> save(
            @AuthenticationPrincipal UserDetails user,
            @RequestBody SaveCoverLetterRequest req
    ) {
        Long userId = resolveUserId(user);
        return ResponseEntity.ok(service.save(userId, req));
    }

    @GetMapping
    public ResponseEntity<?> list(@AuthenticationPrincipal UserDetails user) {
        Long userId = resolveUserId(user);
        return ResponseEntity.ok(service.getList(userId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> detail(
            @AuthenticationPrincipal UserDetails user,
            @PathVariable Long id
    ) {
        Long userId = resolveUserId(user);
        return ResponseEntity.ok(service.getDetail(id, userId));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(
            @AuthenticationPrincipal UserDetails user,
            @PathVariable Long id
    ) {
        Long userId = resolveUserId(user);
        service.delete(id, userId);
        return ResponseEntity.ok().build();
    }
}
