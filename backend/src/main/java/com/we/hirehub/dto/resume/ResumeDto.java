package com.we.hirehub.dto.resume;

import com.we.hirehub.dto.user.UserSummaryDto;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

/**
 * ResumeDto
 * - 이력서(Resume) DTO
 * - profile: 사용자 온보딩 프로필 (일반 사용자용)
 * - users: 작성자 정보 (관리자용)
 * - educationList, careerList, certificateList, skillList, languageList: htmlContent(JSON) 파싱 결과
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ResumeDto {

    private Long id;
    private String title;
    private String idPhoto;
    private String essayTitle;
    private String essayContent;
    private String htmlContent;
    private boolean locked;
    private LocalDate createAt;
    private LocalDate updateAt;
    private UserSummaryDto profile;   // 온보딩 정보 (일반 사용자용)
    private UserInfo users;               // 작성자 정보 (관리자용)

    // htmlContent 파싱 데이터
    private List<Map<String, Object>> educationList;
    private List<Map<String, Object>> careerList;
    private List<Map<String, Object>> certificateList;
    private List<Map<String, Object>> skillList;
    private List<Map<String, Object>> languageList;

    /**
     * 사용자 정보 (관리자용)
     */
    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UserInfo {
        private Long userId;
        private String nickname;
        private String email;
    }

    /** 기존 코드 호환용 생성자 (profile만, users/가변섹션 없음) */
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
            UserSummaryDto profile
    ) {
        this(id, title, idPhoto, essayTitle, essayContent, htmlContent, locked,
                createAt, updateAt, profile, null,
                null, null, null, null, null);
    }

    /** 기존 코드 호환용 생성자 (profile, users 없음) */
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
        this(id, title, idPhoto, essayTitle, essayContent, htmlContent, locked,
                createAt, updateAt, null, null,
                null, null, null, null, null);
    }

    /** 관리자용 생성자 (작성자 정보 포함) */
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
            UserSummaryDto profile,
            UserInfo users
    ) {
        this(id, title, idPhoto, essayTitle, essayContent, htmlContent, locked,
                createAt, updateAt, profile, users,
                null, null, null, null, null);
    }
}
