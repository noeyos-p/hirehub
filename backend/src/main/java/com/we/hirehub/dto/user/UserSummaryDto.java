package com.we.hirehub.dto.user;

import com.we.hirehub.entity.Role;
import lombok.*;

import java.time.LocalDate;

/**
 * UsersDtos + UserProfileMiniDtos 완전 통합 DTO
 * (기존 코드 100% 하위호환)
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserSummaryDto {

    // 공통
    private Long id;
    private String email;
    private String name;
    private String nickname;
    private String phone;
    private String address;
    private String gender;

    // UsersDtos 전용 필드
    private String password;
    private String dob;          // UsersDto는 dob(String)
    private String education;
    private String careerLevel;
    private String position;
    private String location;
    private Role role;

    // MiniDto 전용 필드
    private LocalDate birth;     // UserProfileMiniDtos는 LocalDate birth

    // --------------------------
    // 🔥 하위호환 생성자 1
    // (기존 UsersDtos 생성 방식 그대로 지원)
    // --------------------------
    public UserSummaryDto(
            Long id,
            String email,
            String name,
            String password,
            String nickname,
            String phone,
            String dob,
            String gender,
            String education,
            String careerLevel,
            String position,
            String address,
            String location,
            Role role
    ) {
        this.id = id;
        this.email = email;
        this.name = name;
        this.password = password;
        this.nickname = nickname;
        this.phone = phone;
        this.dob = dob;
        this.gender = gender;
        this.education = education;
        this.careerLevel = careerLevel;
        this.position = position;
        this.address = address;
        this.location = location;
        this.role = role;

        // Mini 필드는 해당 생성자에서는 null
        this.birth = null;
    }

    // --------------------------
    // 🔥 하위호환 생성자 2
    // (기존 UserProfileMiniDtos 구조 그대로)
    // --------------------------
    public UserSummaryDto(
            Long id,
            String nickname,
            String name,
            String phone,
            String gender,
            LocalDate birth,
            String address,
            String email
    ) {
        this.id = id;
        this.nickname = nickname;
        this.name = name;
        this.phone = phone;
        this.gender = gender;
        this.birth = birth;
        this.address = address;
        this.email = email;

        // UsersDtos 전용 필드는 null/기본값
        this.password = null;
        this.dob = null;
        this.education = null;
        this.careerLevel = null;
        this.position = null;
        this.location = null;
        this.role = null;
    }
}
