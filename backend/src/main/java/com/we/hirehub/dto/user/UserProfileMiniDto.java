package com.we.hirehub.dto.user;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;

/**
 * ✅ UserProfileMiniDto
 * - 이력서 화면에서 함께 노출될 사용자 요약 정보
 * - 온보딩 시 입력한 기본 프로필 데이터를 담는다.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class UserProfileMiniDto {

    private Long id;          // 회원 ID
    private String nickname;  // 닉네임
    private String name;      // 이름
    private String phone;     // 전화번호
    private String gender;    // 성별
    private LocalDate birth;  // 생년월일
    private String address;   // 주소
    private String email;     // 이메일
}
