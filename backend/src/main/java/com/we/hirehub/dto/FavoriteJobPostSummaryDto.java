package com.we.hirehub.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.time.LocalDate;

@Data
@AllArgsConstructor
public class FavoriteJobPostSummaryDto {
    private Long favoriteId;
    private Long jobPostId;
    private String title;
    private String companyName;
    private LocalDate endAt;
}
