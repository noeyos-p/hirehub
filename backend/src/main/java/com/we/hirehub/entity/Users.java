package com.we.hirehub.entity;

import jakarta.persistence.*;
import lombok.Data;

/** 완료 */

@Entity
@Data
@Table(name = "users")
public class Users {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(length = 255, nullable = false)
    private String name;

    @Column(length = 255, nullable = false)
    private String nickname;

    @Column(length = 255, nullable = false)
    private String phone;

    // 생년월일
    @Column(length = 255, nullable = false)
    private String dob;

    // 성별
    @Column(length = 255, nullable = false)
    private String gender;

    @Column(length = 255, nullable = false)
    private String email;

    @Column(length = 255, nullable = false)
    private String password;

    // 즐겨찾기
    @ManyToOne
    @JoinColumn(name = "company_id")
    private Company company;

    // 스크랩
    @ManyToOne
    @JoinColumn(name = "jp_id")
    private JobPosts jobPosts;

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
    @Column(nullable = false, length = 30)
    private Role role;


}
