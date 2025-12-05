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
    private KakaoMapService kakaoMapService;   // ⭐ 새로 추가된 의존성 (기존코드 손상 없음)

    // ---------------------------
    //  기존: 전체 조회
    // ---------------------------
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

    // ---------------------------
    //  기존: createCompany (절대 건들지 않음)
    // ---------------------------
    public CompanyDto createCompany(CompanyDto companyDto) {
        Company company = CompanyDto.toEntity(companyDto);
        company = companyRepository.save(company);
        List<String> benefits = benefitsRepository.findByCompanyId(company.getId())
            .stream()
            .map(b -> b.getName())
            .collect(Collectors.toList());
        return CompanyDto.toDto(company, benefits);
    }

    // ---------------------------
    // 기존: 삭제
    // ---------------------------
    public void deleteCompany(Long id) {
        companyRepository.deleteById(id);
    }

    // ---------------------------
    // 기존: ID 조회
    // ---------------------------
    public Company getCompanyById(Long id) {
        return companyRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("해당 회사를 찾을 수 없습니다: " + id));
    }

    // ===============================================================
    // ⭐⭐⭐ 새 기능: 주소 → 위도/경도 자동 포함한 회사 생성
    // ===============================================================

    public CompanyDto createCompanyWithMap(CompanyDto companyDto) {

        // 주소 기반 좌표 요청
        var latLng = kakaoMapService.getLatLngFromAddress(companyDto.getAddress());

        // lat/lng 자동 주입
        companyDto.setLat(latLng.getLat());
        companyDto.setLng(latLng.getLng());

        // 기존 createCompany 로직 재사용 (절대 변경 없음)
        return createCompany(companyDto);
    }

    public Company save(Company company) {
        return companyRepository.save(company);
    }

}
