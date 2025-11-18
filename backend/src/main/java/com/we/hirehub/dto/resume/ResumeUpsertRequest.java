package com.we.hirehub.dto.resume;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * 이력서 작성/수정 요청 DTO
 * 기존 essayContent 외에 htmlContent, educations, careers 등 추가 가능
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ResumeUpsertRequest {

    @NotBlank
    @Size(max = 255)
    private String title;

    private String idPhoto;

    @Size(max = 255)
    private String essayTitle;

    @NotBlank
    private String essayContent;

    @Size(max = 100000)
    private String htmlContent;

    // 선택: JSON 문자열 필드 (학력/경력/자격증/스킬/어학)
    private String educationJson;
    private String careerJson;
    private String certJson;
    private String skillJson;
    private String langJson;
}
