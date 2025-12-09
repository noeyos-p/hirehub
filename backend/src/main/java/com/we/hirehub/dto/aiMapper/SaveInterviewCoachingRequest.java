package com.we.hirehub.dto.aiMapper;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class SaveInterviewCoachingRequest {
    private Long resumeId;
    private String resumeTitle;
    private String jobPostLink;
    private String companyLink;
    private List<InterviewSessionDto> sessions;
}
