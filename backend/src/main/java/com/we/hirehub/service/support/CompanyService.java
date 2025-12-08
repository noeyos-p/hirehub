package com.we.hirehub.service.support;

import com.we.hirehub.dto.support.CompanyDto;
import com.we.hirehub.entity.Company;
import com.we.hirehub.repository.BenefitsRepository;
import com.we.hirehub.repository.CompanyRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CompanyService {

    @Autowired
    private CompanyRepository companyRepository;

    @Autowired
    private BenefitsRepository benefitsRepository;

    @Autowired
    private KakaoMapService kakaoMapService;   // ⭐ 카카오 지도 API 호출 담당

    // ===============================================================
    // 기존 기능: 전체 조회
    // ===============================================================
    public List<CompanyDto> getAllCompanies() {
        return companyRepository.findAll().stream()
                .map(company -> {
                    List<String> benefits = benefitsRepository.findByCompanyId(company.getId())
                            .stream()
                            .map(b -> b.getName())
                            .collect(Collectors.toList());

                    return CompanyDto.toDto(company, benefits);
                })
                .collect(Collectors.toList());
    }

    // ===============================================================
    // 기존 기능: 회사 생성 (절대 수정 X)
    // ===============================================================
    public CompanyDto createCompany(CompanyDto companyDto) {
        Company company = CompanyDto.toEntity(companyDto);
        company = companyRepository.save(company);

        List<String> benefits = benefitsRepository.findByCompanyId(company.getId())
                .stream()
                .map(b -> b.getName())
                .collect(Collectors.toList());

        return CompanyDto.toDto(company, benefits);
    }

    // ===============================================================
    // 기존 기능: 삭제
    // ===============================================================
    public void deleteCompany(Long id) {
        companyRepository.deleteById(id);
    }

    // ===============================================================
    // 기존 기능: ID 조회
    // ===============================================================
    public Company getCompanyById(Long id) {
        return companyRepository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException("해당 회사를 찾을 수 없습니다: " + id));
    }

    // ===============================================================
    // ⭐⭐⭐ 새 기능 1: 주소 → 위도/경도 자동 포함한 회사 생성
    // ===============================================================
    public CompanyDto createCompanyWithMap(CompanyDto dto) {

        if (dto.getAddress() != null) {
            var latLng = kakaoMapService.getLatLngFromAddress(dto.getAddress());

            if (latLng != null) {
                dto.setLat(latLng.getLat());
                dto.setLng(latLng.getLng());
            }
        }

        return createCompany(dto);
    }

    public Company save(Company company) {
        return companyRepository.save(company);
    }

    // ===============================================================
    // ⭐⭐⭐ 새 기능 2: 회사 정보 수정 시 위경도 자동 갱신 (안정본)
    // ===============================================================
    public CompanyDto updateCompanyWithMap(Long id, CompanyDto dto) {

        Company company = companyRepository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException("해당 회사를 찾을 수 없습니다: " + id));

        // ------------------------------------------------------------
        // 주소 변경 여부 확인
        // ------------------------------------------------------------
        boolean addressChanged =
                dto.getAddress() != null &&
                        !dto.getAddress().equals(company.getAddress());

        // ------------------------------------------------------------
        // 주소가 변경되었거나, 기존 lat/lng가 비어있으면 → 자동 재계산
        // ------------------------------------------------------------
        boolean needUpdateCoord =
                addressChanged ||
                        company.getLat() == null ||
                        company.getLng() == null ||
                        dto.getLat() == null ||
                        dto.getLng() == null;

        if (needUpdateCoord) {

            String addressToUse =
                    dto.getAddress() != null ? dto.getAddress() : company.getAddress();

            if (addressToUse != null) {
                var latLng = kakaoMapService.getLatLngFromAddress(addressToUse);

                if (latLng != null) {
                    company.setLat(latLng.getLat());
                    company.setLng(latLng.getLng());
                }
            }
        }

        // ------------------------------------------------------------
        // CompanyDto에 실제 있는 필드만 업데이트 (컴파일러 오류 방지)
        // ------------------------------------------------------------
        if (dto.getName() != null) company.setName(dto.getName());
        if (dto.getAddress() != null) company.setAddress(dto.getAddress());
        if (dto.getWebsite() != null) company.setWebsite(dto.getWebsite());

        // CompanyDto에는 description, industry, ceo, photo 등 없음 → 제외

        companyRepository.save(company);

        // ------------------------------------------------------------
        // 혜택 조회 후 DTO로 변환
        // ------------------------------------------------------------
        List<String> benefits = benefitsRepository.findByCompanyId(company.getId())
                .stream()
                .map(b -> b.getName())
                .collect(Collectors.toList());

        return CompanyDto.toDto(company, benefits);
    }
}
