package com.we.hirehub.dto.chat;

import com.we.hirehub.entity.ChatBot;
import lombok.*;

import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChatBotDto {
    private Long id;
    private String content;        // 질문
    private String botAnswer;      // 답변
    private String category;       // 카테고리 (meta에서 추출)
    private String sessionId;
    private Long userId;
    private LocalDate createAt;

    /**
     * Entity -> DTO 변환 (Factory Method)
     */
    public static ChatBotDto from(ChatBot bot) {
        if (bot == null) return null;

        String category = "";
        if (bot.getMeta() != null && bot.getMeta().containsKey("category")) {
            category = (String) bot.getMeta().get("category");
        }

        return ChatBotDto.builder()
                .id(bot.getId())
                .content(bot.getContent())
                .botAnswer(bot.getBotAnswer())
                .category(category)
                .sessionId(bot.getSession() != null ? bot.getSession().getId() : null)
                .userId(bot.getUsers() != null ? bot.getUsers().getId() : null)
                .createAt(bot.getCreateAt())
                .build();
    }
}