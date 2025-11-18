
package com.we.hirehub.dto.chat;

import com.we.hirehub.entity.LiveChat;
import lombok.*;
import java.time.LocalDateTime;
import java.util.Optional;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class LiveChatDto {
    private Long id;
    private String content;
    private LocalDateTime createAt;
    private String sessionId; // LiveChat.session (@ManyToOne) -> Session.id
    private Long userId;      // Users ID 추가
    private String nickname;  // 추가

    /**
     * LiveChat Entity를 LiveChatDto로 변환
     * 히스토리 조회 시 사용 (getRecentMessages)
     */
    public static LiveChatDto from(LiveChat chat) {
        if (chat == null) {
            return null;
        }

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

        Long userId = Optional.ofNullable(chat.getUser())
                .map(u -> u.getId())
                .orElse(null);

        return LiveChatDto.builder()
                .id(chat.getId())
                .content(chat.getContent())
                .createAt(chat.getCreateAt())
                .sessionId(chat.getSession() != null ? chat.getSession().getId() : null)
                .nickname(nickname)
                .userId(userId)
                .build();
    }

    /**
     * 메시지 전송용 DTO 생성 (WebSocket 브로드캐스트용)
     * Service에서 이미 계산한 닉네임을 사용
     */
    public static LiveChatDto forSend(LiveChat chat, String finalNickname) {
        if (chat == null) {
            return null;
        }

        return LiveChatDto.builder()
                .id(chat.getId())
                .content(chat.getContent())
                .createAt(chat.getCreateAt())
                .sessionId(chat.getSession() != null ? chat.getSession().getId() : null)
                .userId(chat.getUser() != null ? chat.getUser().getId() : null)
                .nickname(finalNickname) // 이미 계산된 닉네임 사용
                .build();
    }
}
