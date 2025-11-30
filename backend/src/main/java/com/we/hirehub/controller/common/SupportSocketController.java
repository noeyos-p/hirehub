package com.we.hirehub.controller.common;

import com.we.hirehub.entity.Users;
import com.we.hirehub.repository.SessionRepository;
import com.we.hirehub.repository.UsersRepository;
import com.we.hirehub.service.support.HelpService;
import com.we.hirehub.ws.SupportQueue;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.util.HashMap;
import java.util.Map;

@Slf4j
@Controller
@RequiredArgsConstructor
public class SupportSocketController {

    private final SimpMessagingTemplate messagingTemplate;
    private final SupportQueue supportQueue;
    private final UsersRepository usersRepository;
    private final HelpService helpService;  // ✅ HelpService로 변경
    private final SessionRepository sessionRepository;

    // ✅ 유저/상담사가 채팅 보냄 (DB 저장 + WebSocket 브로드캐스트)
    @MessageMapping("support.send/{roomId}")
    public void userSend(@DestinationVariable String roomId, Map<String, Object> payload, java.security.Principal principal) {
        log.info("=== 메시지 수신 ===");
        log.info("roomId: {}, payload: {}", roomId, payload);
        log.info("인증 정보: {}", principal != null ? principal.getName() : "null");

        String type = (String) payload.getOrDefault("type", "TEXT");
        String text = (String) payload.getOrDefault("text", "");
        String role = (String) payload.getOrDefault("role", "USER");

        if (!"TEXT".equalsIgnoreCase(type) || text == null || text.isBlank()) {
            log.warn("유효하지 않은 메시지 타입 또는 빈 텍스트");
            return;
        }

        // ✅ 사용자 정보 추출
        Users user = null;

        if ("ADMIN".equals(role)) {
            // 관리자 메시지: Principal에서 이메일을 가져와 Users 조회
            if (principal != null) {
                String email = principal.getName();
                log.info("🔍 ADMIN 역할 - Principal 이메일: {}", email);
                user = usersRepository.findByEmail(email).orElse(null);

                if (user != null) {
                    log.info("✅ 관리자 조회 성공: ID={}, Email={}", user.getId(), user.getEmail());
                } else {
                    log.warn("⚠️ 이메일 {}에 해당하는 관리자를 찾을 수 없음", email);
                }
            } else {
                log.warn("⚠️ ADMIN 역할이지만 Principal이 null입니다");
            }
        } else {
            // 일반 유저 메시지: payload의 userId로 조회
            try {
                Object userIdObj = payload.get("userId");
                log.info("📦 userId 추출 시도: {}", userIdObj);

                if (userIdObj != null) {
                    Long userId = null;
                    if (userIdObj instanceof Number) {
                        userId = ((Number) userIdObj).longValue();
                    } else if (userIdObj instanceof String) {
                        String userIdStr = (String) userIdObj;
                        if (!userIdStr.equals("null") && !userIdStr.isEmpty()) {
                            userId = Long.parseLong(userIdStr);
                        }
                    }

                    if (userId != null) {
                        log.info("🔍 DB에서 userId={} 조회", userId);
                        user = usersRepository.findById(userId).orElse(null);

                        if (user != null) {
                            log.info("✅ 사용자 조회 성공: ID={}, Email={}, Nickname={}",
                                    user.getId(), user.getEmail(), user.getNickname());
                        } else {
                            log.warn("⚠️ userId={}에 해당하는 사용자를 찾을 수 없음", userId);
                        }
                    }
                }
            } catch (Exception e) {
                log.error("⚠ 사용자 정보 추출 실패", e);
            }
        }

        log.info("🔍 최종 저장 정보: userId={}, role={}, text={}",
                user != null ? user.getId() : "null", role, text);

        // ✅ HelpService를 통해 DB 저장 (자동으로 WebSocket 브로드캐스트도 수행)
        try {
            helpService.send(roomId, text, role, user);
            log.info("✅ HelpService를 통한 메시지 저장 및 브로드캐스트 완료");
        } catch (Exception e) {
            log.error("⚠ 메시지 저장/브로드캐스트 실패", e);
        }

        log.info("=== 메시지 처리 완료 ===");
    }

    // 유저가 핸드오프 요청
    @MessageMapping("support.handoff/{roomId}")
    public void handoffRequest(@DestinationVariable String roomId, Map<String, Object> payload, java.security.Principal principal) {
        log.info("=== 핸드오프 요청 받음 ===");
        log.info("roomId: {}", roomId);
        log.info("payload: {}", payload);
        log.info("인증 정보: {}", principal != null ? principal.getName() : "null");

        var s = supportQueue.state(roomId);

        // ✅ 재연결 요청 시 상태 초기화
        s.handoffRequested = true;
        s.handoffAccepted = false;

        // ✅ userId로 DB에서 실제 유저 정보 조회
        Long userId = null;
        try {
            Object userIdObj = payload.get("userId");
            log.info("userIdObj 타입: {}, 값: {}",
                    userIdObj != null ? userIdObj.getClass().getName() : "null",
                    userIdObj);

            if (userIdObj != null) {
                if (userIdObj instanceof Number) {
                    userId = ((Number) userIdObj).longValue();
                } else {
                    String userIdStr = userIdObj.toString();
                    if (!userIdStr.equals("null") && !userIdStr.isEmpty()) {
                        userId = Long.valueOf(userIdStr);
                    }
                }
                log.info("✅ userId 파싱 성공: {}", userId);
            }
        } catch (Exception e) {
            log.error("⚠ userId 파싱 실패", e);
        }

        String userName = "user";
        String userNickname = "user";
        Users user = null;

        if (userId != null) {
            log.info("🔍 DB에서 userId={} 조회 시도", userId);
            user = usersRepository.findById(userId).orElse(null);
            if (user != null) {
                userName = user.getName() != null ? user.getName() : "user";
                userNickname = user.getNickname() != null ? user.getNickname() : "user";
                log.info("✅ 유저 정보 조회 성공: userId={}, name={}, nickname={}", userId, userName, userNickname);
            } else {
                log.warn("⚠️ 유저를 찾을 수 없음: userId={}", userId);
            }
        } else {
            log.warn("⚠️ userId가 null입니다. payload 전체: {}", payload);
        }

        // SupportQueue에 저장
        s.userName = userName;
        s.userNickname = userNickname;
        log.info("📦 SupportQueue에 저장: userName={}, userNickname={}", userName, userNickname);

        // ✅ Help 테이블에 상담 요청 기록
        try {
            helpService.createHelpRequest(roomId, user);
            log.info("✅ Help 테이블에 상담 요청 기록 완료");
        } catch (Exception e) {
            log.error("⚠ Help 테이블 기록 실패", e);
        }

        // 대기 큐에 브로드캐스트
        Map<String, Object> notice = new HashMap<>();
        notice.put("event", "HANDOFF_REQUESTED");
        notice.put("roomId", roomId);
        notice.put("userName", userName);
        notice.put("userNickname", userNickname);
        log.info("📤 큐에 브로드캐스트: {}", notice);
        messagingTemplate.convertAndSend("/topic/support.queue", notice);

        // 유저 방에 알림
        Map<String, Object> ack = new HashMap<>();
        ack.put("type", "HANDOFF_REQUESTED");
        messagingTemplate.convertAndSend("/topic/rooms/" + roomId, ack);

        log.info("✅ 핸드오프 요청 처리 완료: roomId={}, name={}, nickname={}", roomId, userName, userNickname);
    }

    // 상담사가 수락
    @MessageMapping("support.handoff.accept")
    public void handoffAccept(Map<String, Object> payload, java.security.Principal principal) {
        log.info("=== 핸드오프 수락 ===");
        log.info("인증 정보: {}", principal != null ? principal.getName() : "null");

        String roomId = (String) payload.get("roomId");
        if (roomId == null || roomId.isBlank()) return;

        var s = supportQueue.state(roomId);
        s.handoffAccepted = true;

        // SupportQueue에서 저장된 유저 정보 가져오기
        String userName = s.userName != null ? s.userName : "user";
        String userNickname = s.userNickname != null ? s.userNickname : "user";

        log.info("✅ 핸드오프 수락: roomId={}, name={}, nickname={}", roomId, userName, userNickname);

        // ✅ Help 테이블에 상담 수락 기록
        try {
            helpService.acceptHelp(roomId);
            log.info("✅ Help 테이블에 상담 수락 기록 완료");
        } catch (Exception e) {
            log.error("⚠ Help 테이블 기록 실패", e);
        }

        // ✅ 유저 방에 연결 완료 알림 (userName, userNickname 포함)
        Map<String, Object> msg = new HashMap<>();
        msg.put("type", "HANDOFF_ACCEPTED");
        msg.put("role", "SYS");
        msg.put("text", "상담사가 연결되었습니다. 지금부터 실시간 상담이 가능합니다.");
        msg.put("userName", userName);
        msg.put("userNickname", userNickname);
        messagingTemplate.convertAndSend("/topic/rooms/" + roomId, msg);

        log.info("📤 HANDOFF_ACCEPTED 메시지 전송 완료: userName={}, userNickname={}", userName, userNickname);
    }

    // ✅ 유저가 연결 해제
    @MessageMapping("support.disconnect/{roomId}")
    public void userDisconnect(@DestinationVariable String roomId, Map<String, Object> payload, java.security.Principal principal) {
        log.info("=== 유저 연결 해제 ===");
        log.info("인증 정보: {}", principal != null ? principal.getName() : "null");

        var s = supportQueue.state(roomId);

        // SupportQueue에 저장된 정보 사용
        String userName = s.userName != null ? s.userName : "user";
        String userNickname = s.userNickname != null ? s.userNickname : "user";

        s.handoffRequested = false;
        s.handoffAccepted = false;

        log.info("📌 유저 연결 해제: roomId={}, name={}, nickname={}", roomId, userName, userNickname);

        // ✅ Help 테이블에 상담 종료 기록
        try {
            helpService.endHelp(roomId);
            log.info("✅ Help 테이블에 상담 종료 기록 완료");
        } catch (Exception e) {
            log.error("⚠ Help 테이블 기록 실패", e);
        }

        // 상담사와 유저 모두에게 알림
        Map<String, Object> msg = new HashMap<>();
        msg.put("type", "USER_DISCONNECTED");
        msg.put("role", "SYS");
        msg.put("text", "유저가 연결을 해제했습니다.");
        msg.put("userName", userName);
        msg.put("userNickname", userNickname);
        msg.put("roomId", roomId);
        messagingTemplate.convertAndSend("/topic/rooms/" + roomId, msg);
        log.info("📤 방에 USER_DISCONNECTED 전송: /topic/rooms/{}", roomId);

        // 큐에도 알림 (상담사 대시보드 업데이트용)
        Map<String, Object> queueNotice = new HashMap<>();
        queueNotice.put("event", "USER_DISCONNECTED");
        queueNotice.put("roomId", roomId);
        queueNotice.put("userName", userName);
        queueNotice.put("userNickname", userNickname);
        messagingTemplate.convertAndSend("/topic/support.queue", queueNotice);
        log.info("📤 큐에 USER_DISCONNECTED 전송: /topic/support.queue");

        log.info("✅ 유저 연결 해제 알림 전송 완료");
    }

    // ✅ 상담사가 연결 해제
    @MessageMapping("support.agent.disconnect")
    public void agentDisconnect(Map<String, Object> payload, java.security.Principal principal) {
        log.info("=== 상담사 연결 해제 ===");
        log.info("인증 정보: {}", principal != null ? principal.getName() : "null");

        String roomId = (String) payload.get("roomId");
        if (roomId == null || roomId.isBlank()) return;

        var s = supportQueue.state(roomId);
        s.handoffRequested = false;
        s.handoffAccepted = false;

        log.info("📌 상담사 연결 해제: roomId={}", roomId);

        // ✅ Help 테이블에 상담 종료 기록
        try {
            helpService.endHelp(roomId);
            log.info("✅ Help 테이블에 상담 종료 기록 완료");
        } catch (Exception e) {
            log.error("⚠ Help 테이블 기록 실패", e);
        }

        // 유저에게 알림
        Map<String, Object> msg = new HashMap<>();
        msg.put("type", "AGENT_DISCONNECTED");
        msg.put("role", "SYS");
        msg.put("text", "상담사가 연결을 해제했습니다.");
        messagingTemplate.convertAndSend("/topic/rooms/" + roomId, msg);
        log.info("📤 방에 AGENT_DISCONNECTED 전송: /topic/rooms/{}", roomId);

        log.info("✅ 상담사 연결 해제 알림 전송 완료");
    }
}
