package com.we.hirehub.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class TokenResponse {
    private String tokenType;   // "Bearer"
    private String accessToken; // JWT
}
