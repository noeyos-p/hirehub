package com.we.hirehub.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

/** 완료 */

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Table(name = "users")
public class Users {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;

    private String nickname;


    @Column(length = 20)
    private String phone;

    // 🔥 추가됨
    @Column(nullable = false)
    private boolean phoneVerified = false;

    // 생년월일
    private String dob;

    // 성별
    private String gender;

    @Column(nullable = false)
    private String email;

    @Column(nullable = false)
    private String password;
    // 간단한 학력
    @Column(length = 255)
    private String education;

    // 간단한 경력
    @Column(length = 255,name = "career_level")
    private String careerLevel;

    // 간단한 직무
    @Column(length = 255)
    private String position;

    // 주소
    @Column(length = 255)
    private String address;

    // 선호하는 지역
    @Column(length = 255)
    private String location;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role = Role.USER;   // 기본 USER

    @Builder.Default
    private Integer tokenBalance = 0;
}
