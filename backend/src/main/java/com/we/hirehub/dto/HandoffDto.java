package com.we.hirehub.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/** API/뷰에 노출되는 응답 DTO */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HandoffDto {
    private String id;
    private String roomId;
    private String userId;
    private String status; // PENDING/ACCEPTED/REJECTED 등
    private String lastMessage;
    private String userName;
    private String nickname;
}
