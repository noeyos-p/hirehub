package com.we.hirehub.dto;

import java.time.LocalDate;

/**
 * ✅ UserProfileMiniDto
 * - 이력서 화면에서 함께 노출될 사용자 요약 정보
 * - 온보딩 시 입력한 기본 프로필 데이터를 담는다.
 */
public record UserProfileMiniDto(
        Long id,          // 회원 ID
        String nickname,  // ✅ 닉네임
        String name,      // 이름
        String phone,     // 전화번호
        String gender,    // 성별
        LocalDate birth,  // 생년월일
        String address,   // 주소
        String email      // 이메일
) {}
