package com.we.hirehub.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class CompanySummaryDto {
    private Long id;
    private String name;
    private String industry;
    private String address;
    private String photo;   // null 가능
}
