
package com.we.hirehub.dto;

import lombok.*;
import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class LiveChatDto {
    private Long id;
    private String content;
    private LocalDateTime createAt;
    private String sessionId; // LiveChat.session (@ManyToOne) -> Session.id
    private Long userId;      // Users ID 추가
    private String nickname;  // 추가

}
