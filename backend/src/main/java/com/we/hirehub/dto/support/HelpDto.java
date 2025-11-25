package com.we.hirehub.dto.support;

import com.we.hirehub.entity.Help;
import lombok.*;

import java.time.LocalDateTime;
import java.util.Optional;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder

public class HelpDto {

    private Long id;
    private String content;
    private LocalDateTime createAt;
    private String sessionId;
    private Long userId;
    private String nickname;
    private String role; // USER, AGENT, SYS

    /**
     * Help Entity를 HelpDto로 변환
     * 히스토리 조회 시 사용
     */
    public static HelpDto from(Help help) {
        if (help == null) {
            return null;
        }

        // User 엔티티에서 nickname 조회
        String nickname = Optional.ofNullable(help.getUsers())
                .map(u -> {
                    if (u.getNickname() != null && !u.getNickname().trim().isEmpty()) {
                        return u.getNickname();
                    }
                    if (u.getName() != null && !u.getName().trim().isEmpty()) {
                        return u.getName();
                    }
                    return "익명";
                })
                .orElse("상담사");

        Long userId = Optional.ofNullable(help.getUsers())
                .map(u -> u.getId())
                .orElse(null);

        return HelpDto.builder()
                .id(help.getId())
                .content(help.getContent())
                .createAt(help.getCreateAt())
                .sessionId(help.getSession() != null ? help.getSession().getId() : null)
                .nickname(nickname)
                .userId(userId)
                .role(help.getRole())
                .build();
    }

    /**
     * 메시지 전송용 DTO 생성 (WebSocket 브로드캐스트용)
     * Service에서 이미 계산한 닉네임을 사용
     */
    public static HelpDto forSend(Help help, String finalNickname) {
        if (help == null) {
            return null;
        }

        return HelpDto.builder()
                .id(help.getId())
                .content(help.getContent())
                .createAt(help.getCreateAt())
                .sessionId(help.getSession() != null ? help.getSession().getId() : null)
                .userId(help.getUsers() != null ? help.getUsers().getId() : null)
                .nickname(finalNickname)
                .role(help.getRole())
                .build();
    }

}
