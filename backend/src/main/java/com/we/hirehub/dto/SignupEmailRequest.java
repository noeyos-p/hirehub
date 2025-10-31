// src/main/java/com/we/hirehub/dto/SignupEmailRequest.java
package com.we.hirehub.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
public class SignupEmailRequest {
    @NotBlank @Email
    private String email;

    @NotBlank
    private String password;
}
