package com.we.hirehub.service.support;

import com.we.hirehub.dto.support.HelpDto;
import com.we.hirehub.entity.Help;
import com.we.hirehub.entity.Session;
import com.we.hirehub.entity.Users;
import com.we.hirehub.repository.HelpRepository;
import com.we.hirehub.repository.SessionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.messaging.simp.SimpMessagingTemplate;
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
public class HelpService {

    private final HelpRepository helpRepository;
    private final SessionRepository sessionRepository;
    private final SimpMessagingTemplate messagingTemplate;

    /**
     * 최근 메시지 조회 - Fetch Join으로 N+1 문제 해결
     */
    @Transactional(readOnly = true)
    public List<HelpDto> getRecentMessages(String sessionId, int limit) {
        PageRequest pageRequest = PageRequest.of(0, limit);
        List<Help> helps = helpRepository.findBySessionIdWithUser(sessionId, pageRequest);

        return helps.stream()
                .sorted((a, b) -> a.getCreateAt().compareTo(b.getCreateAt()))
                .map(HelpDto::from)
                .collect(Collectors.toList());
    }

    /**
     * 상담 채팅 메시지 전송 (DB 저장 + WebSocket 브로드캐스트)
     */
    @Transactional
    public void send(String sessionId, String content, String role, Users authenticatedUser) {
        log.info("=== 상담 채팅 메시지 전송 시작 ===");
        log.info("sessionId: {}, content: {}, role: {}", sessionId, content, role);
        log.info("전달받은 authenticatedUser: {}", authenticatedUser != null ? authenticatedUser.getId() : "null");

        // 1. Session 조회/생성
        Session session = findOrCreateSession(sessionId);

        // 2. 사용자 및 닉네임 결정
        String finalNickname = determineFinalNickname(authenticatedUser, role);
        log.info("최종 닉네임: {}, User ID: {}, Role: {}",
                finalNickname,
                authenticatedUser != null ? authenticatedUser.getId() : "null",
                role);

        // 3. 메시지 저장 (DB에 저장)
        Help saved = saveMessage(session, content, role, authenticatedUser);
        log.info("✅ 메시지 DB 저장 완료 - ID: {}, User ID: {}, Role: {}",
                saved.getId(),
                saved.getUsers() != null ? saved.getUsers().getId() : "null",
                saved.getRole());

        // 4. DTO 생성
        HelpDto dto = HelpDto.forSend(saved, finalNickname);

        log.info("📤 WebSocket으로 전송할 DTO: id={}, userId={}, nickname={}, role={}",
                dto.getId(), dto.getUserId(), dto.getNickname(), dto.getRole());
        log.info("전송 대상 토픽: /topic/rooms/{}", sessionId);

        // 5. WebSocket으로 메시지 브로드캐스트
        messagingTemplate.convertAndSend("/topic/rooms/" + sessionId, dto);

        log.info("=== 상담 채팅 메시지 전송 완료 ===");
    }

    /**
     * DB 저장만 수행 (WebSocket 브로드캐스트 없이)
     */
    @Transactional
    public Help sendWithoutBroadcast(String sessionId, String content, String role, Users authenticatedUser) {
        log.info("=== 상담 채팅 메시지 DB 저장 (브로드캐스트 없이) ===");
        log.info("sessionId: {}, content: {}, role: {}", sessionId, content, role);

        // 1. Session 조회/생성
        Session session = findOrCreateSession(sessionId);

        // 2. 메시지 저장
        Help saved = saveMessage(session, content, role, authenticatedUser);
        log.info("✅ 메시지 DB 저장 완료 (브로드캐스트 제외) - ID: {}, User ID: {}, Role: {}",
                saved.getId(),
                saved.getUsers() != null ? saved.getUsers().getId() : "null",
                saved.getRole());

        return saved;
    }

    /**
     * 상담 요청 시작 (requestAt 기록)
     */
    @Transactional
    public Help createHelpRequest(String sessionId, Users user) {
        Session session = findOrCreateSession(sessionId);

        Help help = Help.builder()
                .session(session)
                .users(user)
                .requestAt(LocalDateTime.now())
                .content("")  // 초기에는 빈 내용
                .createAt(LocalDateTime.now())
                .role("SYS")
                .build();

        return helpRepository.save(help);
    }

    /**
     * 상담 수락 (startAt 기록)
     */
    @Transactional
    public void acceptHelp(String sessionId) {
        PageRequest pageRequest = PageRequest.of(0, 1);
        List<Help> helps = helpRepository.findLatestBySessionId(sessionId, pageRequest);

        if (!helps.isEmpty()) {
            Help help = helps.get(0);
            help.setStartAt(LocalDateTime.now());
            helpRepository.save(help);
        }
    }

    /**
     * 상담 종료 (endAt 기록)
     */
    @Transactional
    public void endHelp(String sessionId) {
        PageRequest pageRequest = PageRequest.of(0, 1);
        List<Help> helps = helpRepository.findLatestBySessionId(sessionId, pageRequest);

        if (!helps.isEmpty()) {
            Help help = helps.get(0);
            help.setEndAt(LocalDateTime.now());
            helpRepository.save(help);
        }
    }

    /**
     * ✅ 미처리 상담 요청 조회
     * 관리자가 로그인 시 이전에 요청된 미처리 상담들을 확인
     */
    @Transactional(readOnly = true)
    public List<HelpDto> getPendingRequests() {
        List<Help> pendingHelps = helpRepository.findPendingRequests();

        return pendingHelps.stream()
                .map(help -> {
                    String nickname = "익명";
                    if (help.getUsers() != null) {
                        if (help.getUsers().getNickname() != null && !help.getUsers().getNickname().trim().isEmpty()) {
                            nickname = help.getUsers().getNickname();
                        } else if (help.getUsers().getName() != null && !help.getUsers().getName().trim().isEmpty()) {
                            nickname = help.getUsers().getName();
                        }
                    }
                    return HelpDto.builder()
                            .id(help.getId())
                            .sessionId(help.getSession().getId())
                            .userId(help.getUsers() != null ? help.getUsers().getId() : null)
                            .nickname(nickname)
                            .content("상담 요청")
                            .role("SYS")
                            .createAt(help.getRequestAt())
                            .build();
                })
                .collect(Collectors.toList());
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
                    return sessionRepository.save(newSession);
                });
    }

    /**
     * 메시지 저장 (공통 로직)
     */
    private Help saveMessage(Session session, String content, String role, Users user) {
        Help help = Help.builder()
                .session(session)
                .content(content)
                .createAt(LocalDateTime.now())
                .users(user)
                .role(role)
                .build();

        return helpRepository.save(help);
    }

    /**
     * 최종 닉네임 결정 로직
     */
    private String determineFinalNickname(Users user, String role) {
        // ADMIN 역할이면 무조건 "상담사"
        if ("ADMIN".equals(role)) {
            return "상담사";
        }

        // USER 역할인 경우
        if (user != null) {
            log.info("✅ 인증된 사용자 - ID: {}, 닉네임: {}, 이름: {}",
                    user.getId(), user.getNickname(), user.getName());

            return Optional.ofNullable(user.getNickname())
                    .filter(n -> !n.trim().isEmpty())
                    .orElse(Optional.ofNullable(user.getName())
                            .filter(n -> !n.trim().isEmpty())
                            .orElse("익명"));
        } else {
            log.warn("⚠ 인증되지 않은 사용자");
            return "익명";
        }
    }
}
