package com.we.hirehub.dto;

import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class PostSummaryDto {
    private Long id;
    private String title;
    private String createdAt;
    private Long views;
    private Long comments;
}
