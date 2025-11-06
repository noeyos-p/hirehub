package com.we.hirehub.service;

import com.we.hirehub.dto.LiveChatDto;
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
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class LiveChatService {

    private final LiveChatRepository liveChatRepository;
    private final SessionRepository sessionRepository;
    private final UsersRepository usersRepository;
    private final SimpMessagingTemplate messagingTemplate;

    @Transactional(readOnly = true)
    public List<LiveChatDto> getRecentMessages(String sessionId, int limit) {
        PageRequest pageRequest = PageRequest.of(0, limit, Sort.by(Sort.Direction.DESC, "createAt"));
        List<LiveChat> chats = liveChatRepository.findBySessionId(sessionId, pageRequest);

        return chats.stream()
                .sorted((a, b) -> a.getCreateAt().compareTo(b.getCreateAt()))
                .map(this::toLiveChatDto)
                .collect(Collectors.toList());
    }

    // 기존 메서드 (3개 파라미터) - 호환성 유지
    @Transactional
    public void send(String sessionId, String content, String requestNickname) {
        // SecurityContextHolder에서 사용자 조회
        Users user = null;
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();

        if (auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getName())) {
            String email = auth.getName();
            user = usersRepository.findByEmail(email).orElse(null);
        }

        // 새로운 메서드 호출
        send(sessionId, content, requestNickname, user);
    }

    // 새로운 메서드 (4개 파라미터) - 사용자 객체 직접 전달
    @Transactional
    public void send(String sessionId, String content, String requestNickname, Users authenticatedUser) {
        log.info("=== 채팅 메시지 전송 시작 ===");
        log.info("sessionId: {}, content: {}, requestNickname: {}", sessionId, content, requestNickname);
        log.info("전달받은 authenticatedUser: {}", authenticatedUser != null ? authenticatedUser.getId() : "null");

        // 1. Session 조회/생성
        Session session = sessionRepository.findById(sessionId)
                .orElseGet(() -> {
                    Session newSession = Session.builder()
                            .id(sessionId)
                            .ctx(new HashMap<>())
                            .build();
                    return sessionRepository.saveAndFlush(newSession);
                });

        // 2. 사용자 및 닉네임 결정
        Users user = authenticatedUser;
        String finalNickname = "익명";

        if (user != null) {
            log.info("✅ 인증된 사용자 - ID: {}, 닉네임: {}, 이름: {}",
                    user.getId(), user.getNickname(), user.getName());

            // DB의 닉네임 우선 사용
            finalNickname = Optional.ofNullable(user.getNickname())
                    .filter(n -> !n.trim().isEmpty())
                    .orElse(Optional.ofNullable(user.getName())
                            .filter(n -> !n.trim().isEmpty())
                            .orElse("익명"));
        } else {
            log.warn("❌ 인증되지 않은 사용자");
            // 요청에서 닉네임이 전달된 경우 사용
            if (requestNickname != null && !requestNickname.trim().isEmpty()) {
                finalNickname = requestNickname.trim();
                log.info("익명 사용자 - 요청 닉네임 사용: {}", finalNickname);
            }
        }

        log.info("최종 닉네임: {}, User ID: {}", finalNickname, user != null ? user.getId() : "null");

        // 3. 메시지 저장
        LiveChat chat = LiveChat.builder()
                .session(session)
                .content(content)
                .createAt(LocalDateTime.now())
                .user(user)
                .build();

        LiveChat saved = liveChatRepository.saveAndFlush(chat);
        log.info("✅ 메시지 저장 완료 - ID: {}, User ID: {}",
                saved.getId(),
                saved.getUser() != null ? saved.getUser().getId() : "null");

        // 4. DTO 생성 및 전송
        LiveChatDto dto = LiveChatDto.builder()
                .id(saved.getId())
                .content(saved.getContent())
                .createAt(saved.getCreateAt())
                .sessionId(saved.getSession().getId())
                .userId(user != null ? user.getId() : null)  // ← userId 추가
                .nickname(finalNickname)
                .build();

        log.info("📤 WebSocket으로 전송할 DTO: id={}, userId={}, nickname={}",
                dto.getId(), dto.getUserId(), dto.getNickname());
        log.info("전송 대상 토픽: /topic/rooms/{}", sessionId);

        // 5. WebSocket으로 메시지 브로드캐스트
        messagingTemplate.convertAndSend("/topic/rooms/" + sessionId, dto);

        log.info("=== 채팅 메시지 전송 완료 ===");
    }

    private LiveChatDto toLiveChatDto(LiveChat chat) {
        // User 엔티티에서 nickname 조회
        String nickname = Optional.ofNullable(chat.getUser())
                .map(u -> {
                    if (u.getNickname() != null && !u.getNickname().trim().isEmpty()) {
                        return u.getNickname();
                    }
                    if (u.getName() != null && !u.getName().trim().isEmpty()) {
                        return u.getName();
                    }
                    return "익명";
                })
                .orElse("익명");

        return LiveChatDto.builder()
                .id(chat.getId())
                .content(chat.getContent())
                .createAt(chat.getCreateAt())
                .sessionId(chat.getSession().getId())
                .nickname(nickname)
                .userId(chat.getUser() != null ? chat.getUser().getId() : null)  // ✅ 추가된 부분
                .build();
    }

}
