package com.we.hirehub.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

/**
 * 지원 내역 DTO
 * - 엔티티 변경 없이, 지원에 사용한 이력서 식별자(resumeId) 포함
 * - 기존 4인자 생성자(호환용)도 제공하여 기존 서비스 코드 그대로 컴파일 가능
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ApplyResponse {

    /** 지원 내역 ID (apply id) */
    private Long id;

    /** ✅ 지원에 사용한 이력서 ID (신규 필드) */
    private Long resumeId;

    /** 회사명 */
    private String companyName;

    /** 이력서 제목 */
    private String resumeTitle;

    /** 지원일(LocalDate) */
    private LocalDate appliedAt;

    /** ✅ 호환용 4인자 생성자 (기존 코드 유지) */
    public ApplyResponse(Long id, String companyName, String resumeTitle, LocalDate appliedAt) {
        this.id = id;
        this.resumeId = null; // 구버전 호출에서는 null로 둠
        this.companyName = companyName;
        this.resumeTitle = resumeTitle;
        this.appliedAt = appliedAt;
    }
}
