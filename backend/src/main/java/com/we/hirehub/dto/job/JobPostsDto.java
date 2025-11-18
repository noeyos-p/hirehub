package com.we.hirehub.dto.job;

import com.we.hirehub.dto.company.CompanyDto;
import com.we.hirehub.entity.Company;
import com.we.hirehub.entity.JobPosts;
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
    private Long companyId;
    private String companyPhoto;
    private CompanyDto company;
    private Integer views;

    /** JobPosts Mini 일로 옮겨옴 **/
    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class Mini {
        private Long id;
        private String title;
        private String companyName;
        private LocalDate endAt;
    }

    public static JobPostsDto toDto(JobPosts entity) {
        if (entity == null) return null;

        return JobPostsDto.builder()
                .id(entity.getId())
                .title(entity.getTitle())
                .content(entity.getContent())
                .startAt(entity.getStartAt())
                .endAt(entity.getEndAt())
                .location(entity.getLocation())
                .careerLevel(entity.getCareerLevel())
                .education(entity.getEducation())
                .position(entity.getPosition())
                .type(entity.getType())
                .photo(entity.getPhoto())
                .salary(entity.getSalary())
                .companyName(entity.getCompany().getName())
                .companyId(entity.getCompany().getId())
                .companyPhoto(entity.getCompany().getPhoto())
                .company(CompanyDto.toDto(entity.getCompany()))
                .views(entity.getViews())
                .build();
    }

    public static JobPosts toEntity(JobPostsDto dto, Company company) {
        if (dto == null) return null;

        JobPosts posts = new JobPosts();
        posts.setId(dto.getId());
        posts.setTitle(dto.getTitle());
        posts.setContent(dto.getContent());
        posts.setStartAt(dto.getStartAt());
        posts.setEndAt(dto.getEndAt());
        posts.setLocation(dto.getLocation());
        posts.setCareerLevel(dto.getCareerLevel());
        posts.setEducation(dto.getEducation());
        posts.setPosition(dto.getPosition());
        posts.setType(dto.getType());
        posts.setPhoto(dto.getPhoto());
        posts.setSalary(dto.getSalary());
        posts.setCompany(company);
        posts.setViews(dto.getViews());

        return posts;
    }

    public static void updateEntity(JobPostsDto dto, JobPosts entity) {
        if (dto.getTitle() != null) entity.setTitle(dto.getTitle());
        if (dto.getContent() != null) entity.setContent(dto.getContent());
        if (dto.getLocation() != null) entity.setLocation(dto.getLocation());
        if (dto.getCareerLevel() != null) entity.setCareerLevel(dto.getCareerLevel());
        if (dto.getEducation() != null) entity.setEducation(dto.getEducation());
        if (dto.getPosition() != null) entity.setPosition(dto.getPosition());
        if (dto.getType() != null) entity.setType(dto.getType());
        if (dto.getSalary() != null) entity.setSalary(dto.getSalary());
        if (dto.getStartAt() != null) entity.setStartAt(dto.getStartAt());
        if (dto.getEndAt() != null) entity.setEndAt(dto.getEndAt());
        if (dto.getPhoto() != null) entity.setPhoto(dto.getPhoto());
    }
}
