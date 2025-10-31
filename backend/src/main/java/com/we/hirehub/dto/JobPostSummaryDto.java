package com.we.hirehub.dto;

import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class JobPostSummaryDto {
    private Long id;
    private String title;
    private String companyName;
    private String location;
    private String dueDate; // ISO date string (추후 필요 시)
}
