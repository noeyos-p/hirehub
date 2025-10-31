package com.we.hirehub.dto;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

/**
 * ✅ ResumeDto
 * - 이력서(Resume) DTO
 * - profile: 사용자 온보딩 프로필 (일반 사용자용)
 * - users: 작성자 정보 (관리자용)
 * - educationList, careerList, certificateList, skillList, languageList: htmlContent(JSON) 파싱 결과
 */
public record ResumeDto(
        Long id,
        String title,
        String idPhoto,
        String essayTitle,
        String essayContent,
        String htmlContent,
        boolean locked,
        LocalDate createAt,
        LocalDate updateAt,
        UserProfileMiniDto profile,  // 온보딩 정보 (일반 사용자용)
        UserInfo users,              // 작성자 정보 (관리자용)

        // ✅ 추가된 필드들 (htmlContent 파싱 데이터)
        List<Map<String, Object>> educationList,
        List<Map<String, Object>> careerList,
        List<Map<String, Object>> certificateList,
        List<Map<String, Object>> skillList,
        List<Map<String, Object>> languageList
) {
    /**
     * 사용자 정보 (관리자용)
     */
    public record UserInfo(
            Long userId,
            String nickname,
            String email
    ) {}

    /** ✅ 기존 코드 호환용 생성자 (profile만, users/가변섹션 없음) */
    public ResumeDto(
            Long id,
            String title,
            String idPhoto,
            String essayTitle,
            String essayContent,
            String htmlContent,
            boolean locked,
            LocalDate createAt,
            LocalDate updateAt,
            UserProfileMiniDto profile
    ) {
        this(id, title, idPhoto, essayTitle, essayContent, htmlContent, locked, createAt, updateAt, profile, null,
                null, null, null, null, null);
    }

    /** ✅ 기존 코드 호환용 생성자 (profile, users 없음) */
    public ResumeDto(
            Long id,
            String title,
            String idPhoto,
            String essayTitle,
            String essayContent,
            String htmlContent,
            boolean locked,
            LocalDate createAt,
            LocalDate updateAt
    ) {
        this(id, title, idPhoto, essayTitle, essayContent, htmlContent, locked, createAt, updateAt, null, null,
                null, null, null, null, null);
    }

    /** ✅ 관리자용 생성자 (사용자 정보 포함) */
    public ResumeDto(
            Long id,
            String title,
            String idPhoto,
            String essayTitle,
            String essayContent,
            String htmlContent,
            boolean locked,
            LocalDate createAt,
            LocalDate updateAt,
            UserProfileMiniDto profile,
            UserInfo users
    ) {
        this(id, title, idPhoto, essayTitle, essayContent, htmlContent, locked, createAt, updateAt, profile, users,
                null, null, null, null, null);
    }
}
