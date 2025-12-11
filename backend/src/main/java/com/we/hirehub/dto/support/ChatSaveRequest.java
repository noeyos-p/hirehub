package com.we.hirehub.dto.support;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ChatSaveRequest {
    private Long userId;
    private String sessionId;
    private String userMessage;
    private String botAnswer;
}
