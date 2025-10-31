package com.we.hirehub.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Data;

import java.time.LocalDate;

@Data
public class MyProfileDto {
    private Long id;

    // 읽기 전용
    private String email;

    // 수정 대상 필드들 (Users 엔티티에 맞춰 이름만 일치시키면 됨)
    private String name;
    private String phone;          // 예: 010-1234-5678
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate birth;       // LocalDate 사용 시
    private Integer age;
    private String gender;         // "남자"/"여자" 혹은 "M"/"F"
    private String address;
    private String region;         // 지역(시/도)
    private String position;       // 직무
    private String career;         // 경력 (예: "신입", "3년")
    private String education;      // 학력
    private String nickname; // 닉네임
}
