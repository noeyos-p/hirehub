package com.we.hirehub.dto.support;

import com.we.hirehub.entity.Company;
import lombok.*;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CompanyDto {
    private Long id;
    private String name;
    private String content;

    private String address;         // 기본주소
    private String detailAddress;   // ⭐ 추가된 상세주소 (DB 저장 X, 프론트 전용)

    private Integer since;
    private String website;
    private String industry;
    private String ceo;
    private String photo;

    private Double lat;
    private Double lng;
    private List<String> benefitsList;
    private String benefits; // 복리후생 (단일 문자열)
    private String count; // 사원수

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

    /** Entity -> Dto */
    public static CompanyDto toDto(Company entity) {
        if (entity == null) return null;

        return CompanyDto.builder()
                .id(entity.getId())
                .name(entity.getName())
                .content(entity.getContent())
                .address(entity.getAddress())
                .detailAddress("") // ⭐ DB에 없으니까 기본값 빈 문자열
                .since(entity.getSince())
                .website(entity.getWebsite())
                .industry(entity.getIndustry())
                .ceo(entity.getCeo())
                .photo(entity.getPhoto())
                .lat(entity.getLat())
                .lng(entity.getLng())
                .benefitsList(List.of())
                .count(entity.getCount())
                .build();
    }

    /** Entity -> Dto (benefitsList 포함) */
    public static CompanyDto toDto(Company entity, List<String> benefitsList) {
        CompanyDto dto = toDto(entity);
        if (dto != null) {
            dto.setBenefitsList(benefitsList != null ? benefitsList : List.of());
            if (benefitsList != null && !benefitsList.isEmpty()) {
                dto.setBenefits(String.join(", ", benefitsList));
            } else {
                dto.setBenefits("");
            }
        }
        return dto;
    }

    /** Dto -> Entity */
    public static Company toEntity(CompanyDto dto) {
        if (dto == null) return null;

        return Company.builder()
                .id(dto.getId())
                .name(dto.getName())
                .content(dto.getContent())
                .address(dto.getAddress()) // 상세주소는 DB에 저장하지 않음
                .since(dto.getSince())
                .website(dto.getWebsite())
                .industry(dto.getIndustry())
                .ceo(dto.getCeo())
                .photo(dto.getPhoto())
                .lat(dto.getLat())
                .lng(dto.getLng())
                .count(dto.getCount())
                .build();
    }

    /** 업데이트 */
    public static void updateEntity(CompanyDto dto, Company entity) {
        if (dto == null || entity == null) return;

        entity.setName(dto.getName());
        entity.setContent(dto.getContent());
        entity.setAddress(dto.getAddress()); // 기본 주소만 저장
        entity.setSince(dto.getSince());
        entity.setWebsite(dto.getWebsite());
        entity.setIndustry(dto.getIndustry());
        entity.setCeo(dto.getCeo());
        entity.setPhoto(dto.getPhoto());

        entity.setLat(dto.getLat());
        entity.setLng(dto.getLng());
        entity.setCount(dto.getCount());
    }
}
