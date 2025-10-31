
package com.we.hirehub.dto;

import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class SessionDto {
    private String id;     // Session @Id(String)
    private Long userId;   // Session.users (@ManyToOne) -> Users.id
    private String nickname;  // 추가
}
