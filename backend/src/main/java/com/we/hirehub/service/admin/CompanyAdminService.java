package com.we.hirehub.service.admin;

import com.we.hirehub.entity.Company;
import com.we.hirehub.repository.CompanyRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CompanyAdminService {

    private final CompanyRepository companyRepository;

    // ============ 조회 ============

    public Page<Company> getAllCompanies(Pageable pageable) {
        log.debug("모든 기업 조회");
        return companyRepository.findAll(pageable);
    }

    public Company getCompanyById(Long companyId) {
        log.debug("기업 조회: {}", companyId);
        return companyRepository.findById(companyId)
                .orElseThrow(() -> new IllegalArgumentException("기업을 찾을 수 없습니다: " + companyId));
    }

    public Page<Company> searchCompanies(String keyword, Pageable pageable) {
        log.info("기업 검색: {}", keyword);
        return companyRepository.searchByKeyword(keyword, pageable);
    }

    // ============ 생성 ============

    @Transactional
    public Company createCompany(Company company) {
        log.info("기업 생성: {}", company.getName());
        return companyRepository.save(company);
    }

    // ============ 수정 ============

    @Transactional
    public Company updateCompany(Long companyId, Company updateData) {
        log.info("기업 정보 수정: {}", companyId);
        Company company = getCompanyById(companyId);

        if (updateData.getName() != null) company.setName(updateData.getName());
        if (updateData.getContent() != null) company.setContent(updateData.getContent());
        if (updateData.getAddress() != null) company.setAddress(updateData.getAddress());
        if (updateData.getSince() != null) company.setSince(updateData.getSince());
        if (updateData.getBenefits() != null) company.setBenefits(updateData.getBenefits());
        if (updateData.getWebsite() != null) company.setWebsite(updateData.getWebsite());
        if (updateData.getIndustry() != null) company.setIndustry(updateData.getIndustry());
        if (updateData.getCeo() != null) company.setCeo(updateData.getCeo());
        if (updateData.getPhoto() != null) company.setPhoto(updateData.getPhoto());

        return companyRepository.save(company);
    }

    // ============ 삭제 ============

    @Transactional
    public void deleteCompany(Long companyId) {
        log.info("기업 삭제: {}", companyId);
        if (!companyRepository.existsById(companyId)) {
            throw new IllegalArgumentException("존재하지 않는 기업입니다");
        }
        companyRepository.deleteById(companyId);
    }

    @Transactional
    public Company updateCompanyPhoto(Long companyId, String fileUrl) {
        Company company = companyRepository.findById(companyId)
                .orElseThrow(() -> new IllegalArgumentException("해당 기업을 찾을 수 없습니다. ID: " + companyId));

        company.setPhoto(fileUrl); // null이면 삭제, 새 URL이면 업데이트
        return companyRepository.save(company);
    }

}