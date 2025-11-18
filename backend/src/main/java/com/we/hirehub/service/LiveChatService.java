package com.we.hirehub.service;

import com.we.hirehub.dto.chat.LiveChatDto;
import com.we.hirehub.entity.LiveChat;
import com.we.hirehub.entity.Session;
import com.we.hirehub.entity.Users;
import com.we.hirehub.repository.LiveChatRepository;
import com.we.hirehub.repository.SessionRepository;
import com.we.hirehub.repository.UsersRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class LiveChatService {

    private final LiveChatRepository liveChatRepository;
    private final SessionRepository sessionRepository;
    private final SimpMessagingTemplate messagingTemplate;

    /**
     * 최근 메시지 조회 - Fetch Join으로 N+1 문제 해결
     */
    @Transactional(readOnly = true)
    public List<LiveChatDto> getRecentMessages(String sessionId, int limit) {
        PageRequest pageRequest = PageRequest.of(0, limit);
        // ✅ Fetch Join 사용하여 N+1 문제 해결 (Repository에 메서드 추가 필요)
        List<LiveChat> chats = liveChatRepository.findBySessionIdWithUser(sessionId, pageRequest);

        return chats.stream()
                .sorted((a, b) -> a.getCreateAt().compareTo(b.getCreateAt()))
                .map(LiveChatDto::from) // ✅ DTO의 static 메서드 사용
                .collect(Collectors.toList());
    }

    /**
     * 채팅 메시지 전송 (DB 저장 + WebSocket 브로드캐스트)
     */
    @Transactional
    public void send(String sessionId, String content, String requestNickname, Users authenticatedUser) {
        log.info("=== 채팅 메시지 전송 시작 ===");
        log.info("sessionId: {}, content: {}, requestNickname: {}", sessionId, content, requestNickname);
        log.info("전달받은 authenticatedUser: {}", authenticatedUser != null ? authenticatedUser.getId() : "null");

        // 1. Session 조회/생성
        Session session = findOrCreateSession(sessionId);

        // 2. 사용자 및 닉네임 결정
        String finalNickname = determineFinalNickname(authenticatedUser, requestNickname);
        log.info("최종 닉네임: {}, User ID: {}", finalNickname, authenticatedUser != null ? authenticatedUser.getId() : "null");

        // 3. 메시지 저장 (DB에 저장)
        LiveChat saved = saveMessage(session, content, authenticatedUser);
        log.info("✅ 메시지 DB 저장 완료 - ID: {}, User ID: {}",
                saved.getId(),
                saved.getUser() != null ? saved.getUser().getId() : "null");

        // 4. DTO 생성 - DTO 클래스의 static 메서드 사용
        LiveChatDto dto = LiveChatDto.forSend(saved, finalNickname);

        log.info("📤 WebSocket으로 전송할 DTO: id={}, userId={}, nickname={}",
                dto.getId(), dto.getUserId(), dto.getNickname());
        log.info("전송 대상 토픽: /topic/rooms/{}", sessionId);

        // 5. WebSocket으로 메시지 브로드캐스트
        messagingTemplate.convertAndSend("/topic/rooms/" + sessionId, dto);

        log.info("=== 채팅 메시지 전송 완료 ===");
    }

    /**
     * DB 저장만 수행 (WebSocket 브로드캐스트 없이)
     * - 특별한 케이스에서 브로드캐스트 없이 DB에만 저장하고 싶을 때 사용
     */
    @Transactional
    public LiveChat sendWithoutBroadcast(String sessionId, String content, String requestNickname, Users authenticatedUser) {
        log.info("=== 채팅 메시지 DB 저장 (브로드캐스트 없이) ===");
        log.info("sessionId: {}, content: {}, requestNickname: {}", sessionId, content, requestNickname);

        // 1. Session 조회/생성
        Session session = findOrCreateSession(sessionId);

        // 2. 사용자 및 닉네임 결정
        String finalNickname = determineFinalNickname(authenticatedUser, requestNickname);
        log.info("최종 닉네임: {}, User ID: {}", finalNickname, authenticatedUser != null ? authenticatedUser.getId() : "null");

        // 3. 메시지 저장 (DB에 저장)
        LiveChat saved = saveMessage(session, content, authenticatedUser);
        log.info("✅ 메시지 DB 저장 완료 (브로드캐스트 제외) - ID: {}, User ID: {}",
                saved.getId(),
                saved.getUser() != null ? saved.getUser().getId() : "null");

        return saved;
    }

    // ===== Private Helper Methods =====

    /**
     * Session 조회 또는 생성
     */
    private Session findOrCreateSession(String sessionId) {
        return sessionRepository.findById(sessionId)
                .orElseGet(() -> {
                    Session newSession = Session.builder()
                            .id(sessionId)
                            .ctx(new HashMap<>())
                            .build();
                    // ✅ save()로 변경 - 트랜잭션 종료 시 자동으로 flush됨
                    return sessionRepository.save(newSession);
                });
    }

    /**
     * 메시지 저장 (공통 로직)
     */
    private LiveChat saveMessage(Session session, String content, Users user) {
        LiveChat chat = LiveChat.builder()
                .session(session)
                .content(content)
                .createAt(LocalDateTime.now())
                .user(user)
                .build();

        // ✅ save()로 변경 - 트랜잭션 종료 시 자동으로 flush됨
        // MySQL에 정상적으로 저장되며, 성능이 더 좋음
        return liveChatRepository.save(chat);
    }

    /**
     * 최종 닉네임 결정 로직
     */
    private String determineFinalNickname(Users user, String requestNickname) {
        if (user != null) {
            log.info("✅ 인증된 사용자 - ID: {}, 닉네임: {}, 이름: {}",
                    user.getId(), user.getNickname(), user.getName());

            // DB의 닉네임 우선 사용
            return Optional.ofNullable(user.getNickname())
                    .filter(n -> !n.trim().isEmpty())
                    .orElse(Optional.ofNullable(user.getName())
                            .filter(n -> !n.trim().isEmpty())
                            .orElse("익명"));
        } else {
            log.warn("❌ 인증되지 않은 사용자");
            // 요청에서 닉네임이 전달된 경우 사용
            if (requestNickname != null && !requestNickname.trim().isEmpty()) {
                log.info("익명 사용자 - 요청 닉네임 사용: {}", requestNickname);
                return requestNickname.trim();
            }
            return "익명";
        }
    }
}
