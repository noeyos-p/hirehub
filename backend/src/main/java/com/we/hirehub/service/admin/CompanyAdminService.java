package com.we.hirehub.service.admin;

import com.we.hirehub.entity.Benefits;
import com.we.hirehub.entity.Company;
import com.we.hirehub.repository.BenefitsRepository;
import com.we.hirehub.repository.CompanyRepository;
import com.we.hirehub.service.support.KakaoMapService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.*;
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

    // 주소 정리
    private String normalize(String raw) {
        if (raw == null) return null;
        String cleaned = raw.replaceAll("\\[[0-9]{5}\\]\\s*", "");
        return cleaned.trim();
    }

    public Page<Company> getAllCompanies(Pageable pageable) {
        return companyRepository.findAll(pageable);
    }

    public Company getCompanyById(Long id) {
        return companyRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("회사 없음: " + id));
    }

    public Page<Company> searchCompanies(String keyword, Pageable pageable) {
        return companyRepository.searchByKeyword(keyword, pageable);
    }

    @Transactional
    public Company createCompany(Company c) {

        String clean = normalize(c.getAddress());
        c.setAddress(clean);

        try {
            var pos = kakaoMapService.getLatLngFromAddress(clean);
            if (pos != null) {
                c.setLat(pos.getLat());
                c.setLng(pos.getLng());
            }
        } catch (Exception ignored) {}

        return companyRepository.save(c);
    }

    @Transactional
    public Company updateCompany(Long id, Company update, List<String> benefits) {

        Company c = getCompanyById(id);

        if (update.getName() != null) c.setName(update.getName());
        if (update.getContent() != null) c.setContent(update.getContent());
        if (update.getWebsite() != null) c.setWebsite(update.getWebsite());
        if (update.getIndustry() != null) c.setIndustry(update.getIndustry());
        if (update.getCeo() != null) c.setCeo(update.getCeo());
        if (update.getPhoto() != null) c.setPhoto(update.getPhoto());
        if (update.getCount() != null) c.setCount(update.getCount());
        if (update.getCompanyType() != null) c.setCompanyType(update.getCompanyType());
        if (update.getSince() != null) c.setSince(update.getSince());

        // =========================
        // ⭐ 주소 업데이트 (항상 위경도 재계산)
        // =========================
        if (update.getAddress() != null) {

            String clean = normalize(update.getAddress());
            c.setAddress(clean); // 주소 저장

            try {
                var pos = kakaoMapService.getLatLngFromAddress(clean);
                if (pos != null) {
                    c.setLat(pos.getLat());
                    c.setLng(pos.getLng());
                }
            } catch (Exception ignored) {}
        }

        Company saved = companyRepository.save(c);

        // 복리후생 처리
        if (benefits != null) {
            benefitsRepository.deleteByCompanyId(id);
            for (String name : benefits) {
                Benefits b = Benefits.builder()
                        .name(name)
                        .company(saved)
                        .build();
                benefitsRepository.save(b);
            }
        }

        return saved;
    }

    public List<Benefits> getBenefitsByCompanyId(Long id) {
        return benefitsRepository.findByCompanyId(id);
    }

    @Transactional
    public void saveBenefits(List<String> list, Company c) {
        if (list == null) return;

        for (String name : list) {
            Benefits b = Benefits.builder().name(name).company(c).build();
            benefitsRepository.save(b);
        }
    }

    @Transactional
    public void deleteCompany(Long id) {
        benefitsRepository.deleteByCompanyId(id);
        companyRepository.deleteById(id);
    }

    @Transactional
    public Company updateCompanyPhoto(Long id, String url) {
        Company c = getCompanyById(id);
        c.setPhoto(url);
        return companyRepository.save(c);
    }
}
