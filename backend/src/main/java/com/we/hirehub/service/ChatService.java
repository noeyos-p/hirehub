package com.we.hirehub.service;

import com.we.hirehub.entity.LiveChat;
import com.we.hirehub.entity.Session;
import com.we.hirehub.repository.LiveChatRepository;
import com.we.hirehub.repository.SessionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class ChatService {

    private final LiveChatRepository liveChatRepository;
    private final SessionRepository sessionRepository;
    private final SimpMessagingTemplate messagingTemplate;

    @Transactional
    public void send(String sessionId, String content){
        Session session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new IllegalArgumentException("Session not found: " + sessionId));
        LiveChat chat = new LiveChat();
        chat.setSession(session);
        chat.setContent(content);
        chat.setCreateAt(LocalDateTime.now());
        liveChatRepository.save(chat);
        messagingTemplate.convertAndSend("/topic/rooms/" + sessionId, content);
    }
}
