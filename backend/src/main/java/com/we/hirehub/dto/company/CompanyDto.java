package com.we.hirehub.dto.company;

import com.we.hirehub.entity.Company;
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

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class Mini {
        private Long id;
        private String name;
        private String industry;
        private String address;
        private String photo;

    }

    /** Entity -> Dto **/
    public static CompanyDto toDto(Company entity) {
        if (entity == null) return null;

        return CompanyDto.builder()
                .id(entity.getId())
                .name(entity.getName())
                .content(entity.getContent())
                .address(entity.getAddress())
                .since(entity.getSince())
                .benefits(entity.getBenefits())
                .website(entity.getWebsite())
                .industry(entity.getIndustry())
                .ceo(entity.getCeo())
                .photo(entity.getPhoto())
                .build();
    }

    public static Company toEntity(CompanyDto dto) {
        if (dto == null) return null;

        return Company.builder()
                .id(dto.getId())
                .name(dto.getName())
                .content(dto.getContent())
                .address(dto.getAddress())
                .since(dto.getSince())
                .benefits(dto.getBenefits())
                .website(dto.getWebsite())
                .industry(dto.getIndustry())
                .ceo(dto.getCeo())
                .photo(dto.getPhoto())
                .build();
    }


    public static void updateEntity(CompanyDto dto, Company entity) {
        if (dto == null || entity == null) return;

        entity.setName(dto.getName());
        entity.setContent(dto.getContent());
        entity.setAddress(dto.getAddress());
        entity.setSince(dto.getSince());
        entity.setBenefits(dto.getBenefits());
        entity.setWebsite(dto.getWebsite());
        entity.setIndustry(dto.getIndustry());
        entity.setCeo(dto.getCeo());
        entity.setPhoto(dto.getPhoto());
    }

}
