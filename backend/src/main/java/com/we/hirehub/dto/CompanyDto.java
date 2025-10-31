package com.we.hirehub.dto;

import lombok.*;

import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CompanyDto {
    private Long id;
    private String name;
    private String content;
    private String address;
    private LocalDate since;
    private String benefits;
    private String website;
    private String industry;
    private String ceo;
    private String photo;
}
