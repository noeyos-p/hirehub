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
    private LocalDate startAt;
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
    private CompanyDto company;
    private Long views;
    private List<String> techStacks;

    // ✅ JobPosts Entity에 추가된 컬럼들을 DTO에 반영
    private String mainJob;
    private String qualification;
    private String preference;
    private String hireType;

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
                .companyName(entity.getCompany().getName())
                .companyId(entity.getCompany().getId())
                .companyPhoto(entity.getCompany().getPhoto())
                .company(CompanyDto.toDto(entity.getCompany()))
                .views(entity.getViews())
                // ✅ 추가된 필드 매핑
                .mainJob(entity.getMainJob())
                .qualification(entity.getQualification())
                .preference(entity.getPreference())
                .hireType(entity.getHireType())
                .build();
    }

    public static JobPosts toEntity(JobPostsDto dto, Company company) {
        if (dto == null) return null;

        // ✅ new JobPosts() 대신 Builder를 사용하여 모든 필드를 일관되게 초기화
        return JobPosts.builder()
                .id(dto.getId())
                .title(dto.getTitle())
                .content(dto.getContent())
                .startAt(dto.getStartAt())
                .endAt(dto.getEndAt())
                .location(dto.getLocation())
                .careerLevel(dto.getCareerLevel())
                .education(dto.getEducation())
                .position(dto.getPosition())
                .type(dto.getType())
                .photo(dto.getPhoto())
                .company(company)
                .views(dto.getViews())
                // ✅ 추가된 필드 매핑
                .mainJob(dto.getMainJob())
                .qualification(dto.getQualification())
                .preference(dto.getPreference())
                .hireType(dto.getHireType())
                // DTO의 techStacks를 Entity로 변환하는 로직은 서비스 계층에서 처리하는 것이 일반적입니다.
                // 여기서는 JobPosts 엔티티에 TechStack이 @OneToMany로 정의되어 있다고 가정하고 DTO->Entity 변환 시에는 생략합니다.
                .build();
    }

    public static void updateEntity(JobPostsDto dto, JobPosts entity) {
        if (dto.getTitle() != null) entity.setTitle(dto.getTitle());
        if (dto.getContent() != null) entity.setContent(dto.getContent());
        if (dto.getLocation() != null) entity.setLocation(dto.getLocation());
        if (dto.getCareerLevel() != null) entity.setCareerLevel(dto.getCareerLevel());
        if (dto.getEducation() != null) entity.setEducation(dto.getEducation());
        if (dto.getPosition() != null) entity.setPosition(dto.getPosition());
        if (dto.getType() != null) entity.setType(dto.getType());
        if (dto.getStartAt() != null) entity.setStartAt(dto.getStartAt());
        if (dto.getEndAt() != null) entity.setEndAt(dto.getEndAt());
        if (dto.getPhoto() != null) entity.setPhoto(dto.getPhoto());
        // views는 업데이트하지 않는 것이 일반적이지만, 필요하다면 추가 가능합니다.

        // ✅ 추가된 필드 업데이트 로직 반영
        if (dto.getMainJob() != null) entity.setMainJob(dto.getMainJob());
        if (dto.getQualification() != null) entity.setQualification(dto.getQualification());
        if (dto.getPreference() != null) entity.setPreference(dto.getPreference());
        if (dto.getHireType() != null) entity.setHireType(dto.getHireType());

        // **주의:** techStacks는 연관 관계이므로 이 메서드에서 직접 업데이트하는 것은 복잡하며, 별도의 로직이 필요합니다.
    }
}