package com.we.hirehub.mapper;

import com.we.hirehub.dto.login.SessionDto;
import com.we.hirehub.entity.ChatBot;
import com.we.hirehub.entity.Session;

public class SessionMapper {

    public static SessionDto toDto(Session e) {
        if (e == null) return null;

        Long userId = null;
        // ChatBot을 통해 userId 추출
        if (e.getChatBots() != null && !e.getChatBots().isEmpty()) {
            ChatBot chatBot = e.getChatBots().get(0);
            if (chatBot.getUsers() != null) {
                userId = chatBot.getUsers().getId();
            }
        }

        return SessionDto.builder()
                .id(e.getId())
                .userId(userId)
                .build();
    }
}
