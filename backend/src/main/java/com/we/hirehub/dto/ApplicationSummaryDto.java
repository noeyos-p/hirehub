package com.we.hirehub.dto;

import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ApplicationSummaryDto {
    private Long id;
    private Long jobPostId;
    private String jobTitle;
    private String companyName;
    private String appliedAt; // ISO string
    private String status;    // e.g., APPLIED / INTERVIEW / OFFER / REJECTED
}
