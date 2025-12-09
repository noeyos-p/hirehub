package com.we.hirehub.dto.support;

import com.we.hirehub.entity.Company;
import com.we.hirehub.entity.JobPosts;
import lombok.*;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class JobPostsDto {

    private Long id;
    private String title;
    private String content;
    private LocalDate endAt;
    private String location;
    private String careerLevel;
    private String education;
    private String position;
    private String type;
    private String photo;

    private String companyName;
    private Long companyId;
    private String companyPhoto;

    // ⭐ 추가된 지도 좌표 (Company에서 가져옴)
    private Double lat;
    private Double lng;

    private CompanyDto company;
    private Long views;
    private List<String> techStacks;

    // 상세 필드
    private String mainJob;
    private String qualification;
    private String preference;
    private String hireType;

    /** Mini DTO */
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

    /** Entity → DTO 변환 */
    public static JobPostsDto toDto(JobPosts entity) {
        if (entity == null) return null;

        Company c = entity.getCompany();

        return JobPostsDto.builder()
                .id(entity.getId())
                .title(entity.getTitle())
                .content(entity.getContent())
                .endAt(entity.getEndAt())
                .location(entity.getLocation())
                .careerLevel(entity.getCareerLevel())
                .education(entity.getEducation())
                .position(entity.getPosition())
                .type(entity.getType())
                .photo(entity.getPhoto())

                .companyName(c.getName())
                .companyId(c.getId())
                .companyPhoto(c.getPhoto())

                // ⭐ 좌표 매핑 (JobPosts의 좌표 사용하도록 수정)
                .lat(entity.getLat())
                .lng(entity.getLng())

                .company(CompanyDto.toDto(c))
                .views(entity.getViews())

                .mainJob(entity.getMainJob())
                .qualification(entity.getQualification())
                .preference(entity.getPreference())
                .hireType(entity.getHireType())
                .techStacks(entity.getTechStacks() != null 
                        ? entity.getTechStacks().stream().map(com.we.hirehub.entity.TechStack::getName).collect(Collectors.toList())
                        : null)
                .build();
    }

    /** DTO → Entity (등록/수정용) */
    public static JobPosts toEntity(JobPostsDto dto, Company company) {
        if (dto == null) return null;

        return JobPosts.builder()
                .id(dto.getId())
                .title(dto.getTitle())
                .content(dto.getContent())
                .endAt(dto.getEndAt())
                .location(dto.getLocation())
                .careerLevel(dto.getCareerLevel())
                .education(dto.getEducation())
                .position(dto.getPosition())
                .type(dto.getType())
                .photo(dto.getPhoto())
                .company(company)
                .views(dto.getViews())

                .mainJob(dto.getMainJob())
                .qualification(dto.getQualification())
                .preference(dto.getPreference())
                .hireType(dto.getHireType())
                .build();
    }

    /** 기존 Entity 업데이트 */
    public static void updateEntity(JobPostsDto dto, JobPosts entity) {
        if (dto.getTitle() != null) entity.setTitle(dto.getTitle());
        if (dto.getContent() != null) entity.setContent(dto.getContent());
        if (dto.getLocation() != null) entity.setLocation(dto.getLocation());
        if (dto.getCareerLevel() != null) entity.setCareerLevel(dto.getCareerLevel());
        if (dto.getEducation() != null) entity.setEducation(dto.getEducation());
        if (dto.getPosition() != null) entity.setPosition(dto.getPosition());
        if (dto.getType() != null) entity.setType(dto.getType());
        if (dto.getEndAt() != null) entity.setEndAt(dto.getEndAt());
        if (dto.getPhoto() != null) entity.setPhoto(dto.getPhoto());

        // 상세 필드 업데이트
        if (dto.getMainJob() != null) entity.setMainJob(dto.getMainJob());
        if (dto.getQualification() != null) entity.setQualification(dto.getQualification());
        if (dto.getPreference() != null) entity.setPreference(dto.getPreference());
        if (dto.getHireType() != null) entity.setHireType(dto.getHireType());
    }
}
