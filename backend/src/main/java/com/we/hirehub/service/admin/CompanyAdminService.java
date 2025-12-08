package com.we.hirehub.service.admin;

import com.we.hirehub.entity.Benefits;
import com.we.hirehub.entity.Company;
import com.we.hirehub.repository.BenefitsRepository;
import com.we.hirehub.repository.CompanyRepository;
import com.we.hirehub.service.support.KakaoMapService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CompanyAdminService {

    private final CompanyRepository companyRepository;
    private final BenefitsRepository benefitsRepository;
    private final KakaoMapService kakaoMapService;

    // ============================================================================
    // 🔥 주소 정규화(우편번호 제거 + 공백 다듬기)
    // ============================================================================
    private String normalizeAddress(String raw) {
        if (raw == null) return null;

        // [12345] 패턴 제거
        String cleaned = raw.replaceAll("\\[[0-9]{5}\\]\\s*", "");

        // 앞뒤 공백 제거
        cleaned = cleaned.trim();

        log.info("📌 주소 정규화: '{}' → '{}'", raw, cleaned);
        return cleaned;
    }

    // ============================================================================
    // 조회
    // ============================================================================
    public Page<Company> getAllCompanies(Pageable pageable) {
        return companyRepository.findAll(pageable);
    }

    public Company getCompanyById(Long companyId) {
        return companyRepository.findById(companyId)
                .orElseThrow(() -> new IllegalArgumentException("기업을 찾을 수 없습니다: " + companyId));
    }

    public Page<Company> searchCompanies(String keyword, Pageable pageable) {
        return companyRepository.searchByKeyword(keyword, pageable);
    }

    // ============================================================================
    // 생성 (lat/lng 자동 계산 포함)
    // ============================================================================
    @Transactional
    public Company createCompany(Company company) {

        // 주소 정규화
        String cleanAddress = normalizeAddress(company.getAddress());
        company.setAddress(cleanAddress);

        // 위·경도 자동 계산
        try {
            var latLng = kakaoMapService.getLatLngFromAddress(cleanAddress);

            if (latLng != null) {
                company.setLat(latLng.getLat());
                company.setLng(latLng.getLng());
            } else {
                log.warn("⚠ 주소 검색 실패 → 위경도 null로 저장됨: {}", cleanAddress);
            }

        } catch (Exception e) {
            log.error("❌ 위경도 계산 중 오류 발생 → null로 저장됨", e);
        }

        return companyRepository.save(company);
    }

    // ============================================================================
    // 수정 (주소 변경 시 lat/lng 자동 갱신)
    // ============================================================================
    @Transactional
    public Company updateCompany(Long companyId, Company updateData, List<String> benefitsList) {

        Company company = getCompanyById(companyId);

        // 기본 필드 업데이트
        if (updateData.getName() != null) company.setName(updateData.getName());
        if (updateData.getContent() != null) company.setContent(updateData.getContent());
        if (updateData.getWebsite() != null) company.setWebsite(updateData.getWebsite());
        if (updateData.getIndustry() != null) company.setIndustry(updateData.getIndustry());
        if (updateData.getCeo() != null) company.setCeo(updateData.getCeo());
        if (updateData.getPhoto() != null) company.setPhoto(updateData.getPhoto());
        if (updateData.getCount() != null) company.setCount(updateData.getCount());
        if (updateData.getCompanyType() != null) company.setCompanyType(updateData.getCompanyType());
        if (updateData.getSince() != null) company.setSince(updateData.getSince());

        // -----------------------------
        // ⭐ 주소 변경 처리 (+ lat/lng 자동 갱신)
        // -----------------------------
        if (updateData.getAddress() != null) {

            String cleanAddress = normalizeAddress(updateData.getAddress());
            boolean changed = !cleanAddress.equals(company.getAddress());

            company.setAddress(cleanAddress);

            if (changed) {
                try {
                    var latLng = kakaoMapService.getLatLngFromAddress(cleanAddress);

                    if (latLng != null) {
                        company.setLat(latLng.getLat());
                        company.setLng(latLng.getLng());
                    } else {
                        log.warn("⚠ 주소 검색 실패 → 기존 위경도 유지: {}", cleanAddress);
                    }

                } catch (Exception e) {
                    log.error("❌ 주소 변경 후 위경도 계산 실패 → 기존 값 유지", e);
                }
            }
        }

        Company saved = companyRepository.save(company);

        // ============================================================================
        // 복리후생 업데이트
        // ============================================================================
        if (benefitsList != null) {
            benefitsRepository.deleteByCompanyId(companyId);

            for (String b : benefitsList) {
                Benefits benefit = Benefits.builder()
                        .name(b)
                        .company(saved)
                        .build();
                benefitsRepository.save(benefit);
            }
        }

        return saved;
    }

    // ============================================================================
    // 복리후생 조회
    // ============================================================================
    public List<Benefits> getBenefitsByCompanyId(Long companyId) {
        return benefitsRepository.findByCompanyId(companyId);
    }

    // ============================================================================
    // 복리후생 저장
    // ============================================================================
    @Transactional
    public void saveBenefits(List<String> benefitsList, Company company) {
        if (benefitsList == null || benefitsList.isEmpty()) return;

        for (String benefitName : benefitsList) {
            Benefits b = Benefits.builder()
                    .name(benefitName)
                    .company(company)
                    .build();
            benefitsRepository.save(b);
        }
    }

    // ============================================================================
    // 삭제
    // ============================================================================
    @Transactional
    public void deleteCompany(Long companyId) {
        if (!companyRepository.existsById(companyId)) {
            throw new IllegalArgumentException("존재하지 않는 기업입니다");
        }
        benefitsRepository.deleteByCompanyId(companyId);
        companyRepository.deleteById(companyId);
    }

    // ============================================================================
    // 로고 업데이트
    // ============================================================================
    @Transactional
    public Company updateCompanyPhoto(Long companyId, String fileUrl) {
        Company c = getCompanyById(companyId);
        c.setPhoto(fileUrl);
        return companyRepository.save(c);
    }
}
