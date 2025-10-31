package com.we.hirehub.controller;

import com.we.hirehub.ws.SupportQueue;
import com.we.hirehub.service.ChatService; // 네 서비스 시그니처에 맞추어 optional 사용
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.util.HashMap;
import java.util.Map;

@Controller
@RequiredArgsConstructor
public class SupportSocketController {

    private final SimpMessagingTemplate messagingTemplate;
    private final SupportQueue supportQueue;

    @Autowired(required = false)
    private ChatService chatService; // 없어도 앱이 뜸

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
        var s = supportQueue.state(roomId);
        s.handoffRequested = true;
        s.userName = (String) payload.getOrDefault("userName", "user");

        Map<String, Object> notice = new HashMap<>();
        notice.put("event", "HANDOFF_REQUESTED");
        notice.put("roomId", roomId);
        notice.put("userName", s.userName);
        messagingTemplate.convertAndSend("/topic/support.queue", notice);

        Map<String, Object> ack = new HashMap<>();
        ack.put("type", "HANDOFF_REQUESTED");
        messagingTemplate.convertAndSend("/topic/rooms/" + roomId, ack);
    }

    // 상담사가 수락
    @MessageMapping("support.handoff.accept")
    public void handoffAccept(Map<String, Object> payload) {
        String roomId = (String) payload.get("roomId");
        if (roomId == null || roomId.isBlank()) return;

        var s = supportQueue.state(roomId);
        s.handoffAccepted = true;

        Map<String, Object> msg = new HashMap<>();
        msg.put("type", "HANDOFF_ACCEPTED");
        messagingTemplate.convertAndSend("/topic/rooms/" + roomId, msg);
    }
}
