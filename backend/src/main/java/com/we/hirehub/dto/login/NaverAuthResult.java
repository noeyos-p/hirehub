// src/main/java/com/we/hirehub/naverauth/dto/NaverAuthResult.java
package com.we.hirehub.dto.login;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class NaverAuthResult {

    private String jwt;
    private String email;
    private boolean isNewUser;
}
