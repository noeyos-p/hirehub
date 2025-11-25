// com.we.hirehub.controller.ChatController
package com.we.hirehub.controller.user;

import com.we.hirehub.dto.support.ChatMessageRequest;
import com.we.hirehub.dto.support.HelpDto;
import com.we.hirehub.dto.support.LiveChatDto;
import com.we.hirehub.entity.Users;
import com.we.hirehub.repository.UsersRepository;
import com.we.hirehub.service.support.HelpService;
import com.we.hirehub.service.support.LiveChatService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/chat")  // 공통 경로 추가
public class ChatController {

    private final LiveChatService liveChatService;
    private final HelpService helpService;  // ✅ HelpService 추가
    private final UsersRepository usersRepository;

    // ===== LiveChat (유저 간 채팅) 관련 엔드포인트 =====

    /**
     * 유저 간 채팅 히스토리 조회
     */
    @GetMapping("/history/{sessionId}")
    public ResponseEntity<List<LiveChatDto>> getChatHistory(
            @PathVariable String sessionId,
            @RequestParam(defaultValue = "30") int limit
    ) {
        log.info("채팅 히스토리 조회 - sessionId: {}, limit: {}", sessionId, limit);
        List<LiveChatDto> messages = liveChatService.getRecentMessages(sessionId, limit);
        return ResponseEntity.ok(messages);
    }

    /**
     * 유저 간 채팅 메시지 전송
     */
    @PostMapping("/send")
    public ResponseEntity<?> sendMessage(@RequestBody ChatMessageRequest request) {
        log.info("=== /api/chat/send 컨트롤러 시작 ===");
        log.info("요청 데이터 - sessionId: {}, content: {}, nickname: {}",
                request.getSessionId(), request.getContent(), request.getNickname());

        Users authenticatedUser = getAuthenticatedUser();

        liveChatService.send(
                request.getSessionId(),
                request.getContent(),
                request.getNickname(),
                authenticatedUser
        );

        log.info("=== /api/chat/send 컨트롤러 완료 ===");
        return ResponseEntity.ok().build();
    }

    // ===== Help (상담사-유저 채팅) 관련 엔드포인트 =====

    /**
     * 상담 채팅 히스토리 조회
     */
    @GetMapping("/help/history/{sessionId}")
    public ResponseEntity<List<HelpDto>> getHelpHistory(
            @PathVariable String sessionId,
            @RequestParam(defaultValue = "30") int limit
    ) {
        log.info("상담 채팅 히스토리 조회 - sessionId: {}, limit: {}", sessionId, limit);
        List<HelpDto> messages = helpService.getRecentMessages(sessionId, limit);
        return ResponseEntity.ok(messages);
    }

    /**
     * 상담 채팅 메시지 전송 (REST API용 - 일반적으로는 WebSocket 사용)
     */
    @PostMapping("/help/send")
    public ResponseEntity<?> sendHelpMessage(@RequestBody ChatMessageRequest request) {
        log.info("=== /api/chat/help/send 컨트롤러 시작 ===");
        log.info("요청 데이터 - sessionId: {}, content: {}, role: {}",
                request.getSessionId(), request.getContent(),
                request.getNickname() != null ? "AGENT" : "USER");

        Users authenticatedUser = getAuthenticatedUser();

        // nickname이 있으면 상담사, 없으면 유저
        String role = (request.getNickname() != null && !request.getNickname().isEmpty())
                ? "AGENT" : "USER";

        helpService.send(
                request.getSessionId(),
                request.getContent(),
                role,
                authenticatedUser
        );

        log.info("=== /api/chat/help/send 컨트롤러 완료 ===");
        return ResponseEntity.ok().build();
    }

    // ===== Private Helper Methods =====

    /**
     * 현재 인증된 사용자 조회
     */
    private Users getAuthenticatedUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        log.info("컨트롤러 인증 정보: {}", auth);
        log.info("Principal: {}", auth != null ? auth.getName() : "null");
        log.info("Authenticated: {}", auth != null ? auth.isAuthenticated() : "false");

        Users authenticatedUser = null;

        if (auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getName())) {
            String principal = auth.getName();
            log.info("Principal 값: {}", principal);

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
                log.warn("⚠ 컨트롤러에서 사용자 조회 실패 - Principal: {}", principal);
            }
        } else {
            log.warn("⚠ 컨트롤러에서 인증 실패 또는 익명 사용자");
        }

        return authenticatedUser;
    }
}