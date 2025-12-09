package com.we.hirehub.dto.aiMapper;

import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InterviewCoachingHistoryDto {
    private Long id;  // 첫 번째 세션의 ID를 대표값으로 사용
    private Long resumeId;
    private String resumeTitle;
    private String jobPostLink;
    private String companyLink;
    private List<InterviewSessionDto> sessions;
    private LocalDateTime createdAt;  // 첫 번째 세션의 생성시간
}
