package com.we.hirehub.dto;

import com.we.hirehub.entity.Role;
import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class UsersDto {
    private Long id;
    private String email;
    private String name;
    private String password;

    // UsersMapper에서 참조하는 필드들
    private String nickname;
    private String phone;
    private String dob;        // ★ 엔티티(Users)의 dob(String)과 일치하도록 String으로 수정
    private String gender;
    private String education;
    private String careerLevel;
    private String position;
    private String address;
    private String location;

    private Role role;         // 엔티티의 Role enum 사용
}
