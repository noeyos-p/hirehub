package com.we.hirehub.dto;

import lombok.*;
import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class JobPostsDto {
    private Long id;
    private String title;
    private String content;
    private LocalDate startAt;
    private LocalDate endAt;
    private String location;
    private String careerLevel;
    private String education;
    private String position;
    private String type;
    private String photo;
    private String salary;
    private String companyName;
    private Long companyId;  // ⭐ 이 필드 추가
    private String companyPhoto;
    private CompanyDto company;
    private Integer views;

    // ✅ 내부 클래스 추가
    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CompanyDto {
        private Long id;
        private String name;
        private String photo;
    }
}
