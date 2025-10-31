package com.we.hirehub.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * 이력서 작성/수정 요청 DTO
 * 기존 essayContent 외에 htmlContent, educations, careers 등 추가 가능
 */
public record ResumeUpsertRequest(
        @NotBlank @Size(max = 255) String title,
        String idPhoto,
        @Size(max = 255) String essayTitle,
        @NotBlank String essayContent,
        @Size(max = 100000) String htmlContent,

        // ✅ 추가: 선택적 JSON 문자열 필드 (학력/경력 등)
        String educationJson,
        String careerJson,
        String certJson,
        String skillJson,
        String langJson
) {}
