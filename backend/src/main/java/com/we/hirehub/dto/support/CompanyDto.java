package com.we.hirehub.dto.support;

import com.we.hirehub.entity.Company;
import lombok.*;

import java.util.List;
import java.util.stream.Collectors;

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
    private Integer since;
    private String website;
    private String industry;
    private String ceo;
    private String photo;

    // ⭐⭐ 추가된 필드
    private Double lat;
    private Double lng;
    private List<String> benefitsList;

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
                .website(entity.getWebsite())
                .industry(entity.getIndustry())
                .ceo(entity.getCeo())
                .photo(entity.getPhoto())
                // ⭐⭐ 추가된 부분
                .lat(entity.getLat())
                .lng(entity.getLng())
                .benefitsList(List.of()) // benefitsList는 별도로 설정 필요
                .build();
    }

    /** Entity -> Dto (benefitsList 포함) **/
    public static CompanyDto toDto(Company entity, List<String> benefitsList) {
        CompanyDto dto = toDto(entity);
        if (dto != null) {
            dto.setBenefitsList(benefitsList != null ? benefitsList : List.of());
        }
        return dto;
    }

    /** Dto -> Entity **/
    public static Company toEntity(CompanyDto dto) {
        if (dto == null) return null;

        return Company.builder()
                .id(dto.getId())
                .name(dto.getName())
                .content(dto.getContent())
                .address(dto.getAddress())
                .since(dto.getSince())
                .website(dto.getWebsite())
                .industry(dto.getIndustry())
                .ceo(dto.getCeo())
                .photo(dto.getPhoto())
                // ⭐⭐ 추가된 부분
                .lat(dto.getLat())
                .lng(dto.getLng())
                .build();
    }

    /** 업데이트 **/
    public static void updateEntity(CompanyDto dto, Company entity) {
        if (dto == null || entity == null) return;

        entity.setName(dto.getName());
        entity.setContent(dto.getContent());
        entity.setAddress(dto.getAddress());
        entity.setSince(dto.getSince());
        entity.setWebsite(dto.getWebsite());
        entity.setIndustry(dto.getIndustry());
        entity.setCeo(dto.getCeo());
        entity.setPhoto(dto.getPhoto());

        // ⭐⭐ 추가된 부분
        entity.setLat(dto.getLat());
        entity.setLng(dto.getLng());
    }
}
