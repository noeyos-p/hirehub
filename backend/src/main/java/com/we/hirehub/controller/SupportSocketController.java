package com.we.hirehub.controller;

import com.we.hirehub.entity.Users;
import com.we.hirehub.repository.UsersRepository;
import com.we.hirehub.ws.SupportQueue;
import com.we.hirehub.service.ChatService; // 네 서비스 시그니처에 맞추어 optional 사용
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
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
    private final UsersRepository usersRepository; // ✅ 추가

    @Autowired(required = false)
    private ChatService chatService;

    // 유저가 채팅 보냄
    @MessageMapping("support.send/{roomId}")
    public void userSend(@DestinationVariable String roomId, Map<String, Object> payload) {
        String type = (String) payload.getOrDefault("type", "TEXT");
        String text = (String) payload.getOrDefault("text", "");
        String role = (String) payload.getOrDefault("role", "USER");

        if ("TEXT".equalsIgnoreCase(type) && text != null && !text.isBlank() && chatService != null) {
            try { chatService.send(roomId, text); } catch (Exception ignored) {}
        }

        Map<String, Object> echo = new HashMap<>();
        echo.put("type", type);
        echo.put("role", role);
        echo.put("text", text);
        messagingTemplate.convertAndSend("/topic/rooms/" + roomId, echo);
    }

    // 유저가 핸드오프 요청
    @MessageMapping("support.handoff/{roomId}")
    public void handoffRequest(@DestinationVariable String roomId, Map<String, Object> payload) {
        log.info("=== 핸드오프 요청 받음 ===");
        log.info("roomId: {}", roomId);
        log.info("payload: {}", payload);

        var s = supportQueue.state(roomId);
        s.handoffRequested = true;

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
                    userId = Long.valueOf(userIdObj.toString());
                }
                log.info("✅ userId 파싱 성공: {}", userId);
            }
        } catch (Exception e) {
            log.error("❌ userId 파싱 실패", e);
        }

        String userName = "user";
        String userNickname = "user";

        if (userId != null) {
            log.info("🔍 DB에서 userId={} 조회 시도", userId);
            Users user = usersRepository.findById(userId).orElse(null);
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
    public void handoffAccept(Map<String, Object> payload) {
        String roomId = (String) payload.get("roomId");
        if (roomId == null || roomId.isBlank()) return;

        var s = supportQueue.state(roomId);
        s.handoffAccepted = true;

        // SupportQueue에서 저장된 유저 정보 가져오기
        String userName = s.userName != null ? s.userName : "user";
        String userNickname = s.userNickname != null ? s.userNickname : "user";

        log.info("✅ 핸드오프 수락: roomId={}, name={}, nickname={}", roomId, userName, userNickname);

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
    public void userDisconnect(@DestinationVariable String roomId, Map<String, Object> payload) {
        var s = supportQueue.state(roomId);

        // SupportQueue에 저장된 정보 사용
        String userName = s.userName != null ? s.userName : "user";
        String userNickname = s.userNickname != null ? s.userNickname : "user";

        s.handoffRequested = false;
        s.handoffAccepted = false;

        log.info("📌 유저 연결 해제: roomId={}, name={}, nickname={}", roomId, userName, userNickname);

        // 상담사와 유저 모두에게 알림
        Map<String, Object> msg = new HashMap<>();
        msg.put("type", "USER_DISCONNECTED");
        msg.put("userName", userName);
        msg.put("userNickname", userNickname);
        msg.put("roomId", roomId);
        messagingTemplate.convertAndSend("/topic/rooms/" + roomId, msg);

        // 큐에도 알림 (상담사 대시보드 업데이트용)
        Map<String, Object> queueNotice = new HashMap<>();
        queueNotice.put("event", "USER_DISCONNECTED");
        queueNotice.put("roomId", roomId);
        queueNotice.put("userName", userName);
        queueNotice.put("userNickname", userNickname);
        messagingTemplate.convertAndSend("/topic/support.queue", queueNotice);

        log.info("✅ 유저 연결 해제 알림 전송 완료");
    }

    // ✅ 상담사가 연결 해제
    @MessageMapping("support.agent.disconnect")
    public void agentDisconnect(Map<String, Object> payload) {
        String roomId = (String) payload.get("roomId");
        if (roomId == null || roomId.isBlank()) return;

        var s = supportQueue.state(roomId);
        s.handoffRequested = false;
        s.handoffAccepted = false;

        log.info("📌 상담사 연결 해제: roomId={}", roomId);

        // 유저에게 알림
        Map<String, Object> msg = new HashMap<>();
        msg.put("type", "AGENT_DISCONNECTED");
        messagingTemplate.convertAndSend("/topic/rooms/" + roomId, msg);
    }
}
