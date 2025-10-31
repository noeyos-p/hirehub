// com.we.hirehub.controller.ChatController
package com.we.hirehub.controller;

import com.we.hirehub.dto.ChatMessageRequest;
import com.we.hirehub.dto.LiveChatDto;
import com.we.hirehub.entity.LiveChat;
import com.we.hirehub.entity.Session;
import com.we.hirehub.entity.Users;
import com.we.hirehub.repository.LiveChatRepository;
import com.we.hirehub.repository.SessionRepository;
import com.we.hirehub.repository.UsersRepository;
import com.we.hirehub.service.LiveChatService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/chat")  // 공통 경로 추가
public class ChatController {

    private final LiveChatService liveChatService;
    private final UsersRepository usersRepository;

    @GetMapping("/history/{sessionId}")
    public ResponseEntity<List<LiveChatDto>> getChatHistory(
            @PathVariable String sessionId,
            @RequestParam(defaultValue = "30") int limit
    ) {
        log.info("채팅 히스토리 조회 - sessionId: {}, limit: {}", sessionId, limit);
        List<LiveChatDto> messages = liveChatService.getRecentMessages(sessionId, limit);
        return ResponseEntity.ok(messages);
    }

    @PostMapping("/send")
    public ResponseEntity<?> sendMessage(@RequestBody ChatMessageRequest request) {
        log.info("=== /api/chat/send 컨트롤러 시작 ===");
        log.info("요청 데이터 - sessionId: {}, content: {}, nickname: {}",
                request.getSessionId(), request.getContent(), request.getNickname());

        // 컨트롤러에서 인증 정보 확인
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        log.info("컨트롤러 인증 정보: {}", auth);
        log.info("Principal: {}", auth != null ? auth.getName() : "null");
        log.info("Authenticated: {}", auth != null ? auth.isAuthenticated() : "false");

        Users authenticatedUser = null;

        if (auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getName())) {
            String principal = auth.getName();
            log.info("Principal 값: {}", principal);

            // Principal이 숫자(ID)인지 이메일인지 확인
            try {
                // 숫자로 파싱 시도 - 성공하면 ID로 간주
                Long userId = Long.parseLong(principal);
                log.info("Principal이 ID로 판단됨: {}", userId);
                authenticatedUser = usersRepository.findById(userId).orElse(null);
            } catch (NumberFormatException e) {
                // 숫자가 아니면 이메일로 간주
                log.info("Principal이 이메일로 판단됨: {}", principal);
                authenticatedUser = usersRepository.findByEmail(principal).orElse(null);
            }

            if (authenticatedUser != null) {
                log.info("✅ 컨트롤러에서 사용자 조회 성공 - ID: {}, 이메일: {}, 닉네임: {}",
                        authenticatedUser.getId(),
                        authenticatedUser.getEmail(),
                        authenticatedUser.getNickname());
            } else {
                log.warn("❌ 컨트롤러에서 사용자 조회 실패 - Principal: {}", principal);
            }
        } else {
            log.warn("❌ 컨트롤러에서 인증 실패 또는 익명 사용자");
        }

        // 서비스 호출
        liveChatService.send(
                request.getSessionId(),
                request.getContent(),
                request.getNickname(),
                authenticatedUser
        );

        log.info("=== /api/chat/send 컨트롤러 완료 ===");
        return ResponseEntity.ok().build();
    }
}
