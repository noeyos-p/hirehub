// src/main/java/com/we/hirehub/kakaoauth/KakaoAuthResult.java
package com.we.hirehub.dto.login;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class KakaoAuthResult {

    private String jwt;
    private String email;
    private boolean isNewUser;
}