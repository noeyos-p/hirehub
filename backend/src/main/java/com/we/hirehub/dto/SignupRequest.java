package com.we.hirehub.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class SignupRequest {
    @Email @NotBlank private String email;     // 로그인 아이디로 사용
    @NotBlank private String password;

    @NotBlank private String name;
    @NotBlank private String nickname;
    @NotBlank private String phone;
    @NotBlank private String dob;              // yyyy-MM-dd 문자열로 간단히
    @NotBlank private String gender;           // M/F
}
