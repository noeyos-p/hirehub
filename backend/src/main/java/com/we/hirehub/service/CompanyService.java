package com.we.hirehub.service;

import com.we.hirehub.dto.CompanyDto;
import com.we.hirehub.entity.Company;
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


    public List<CompanyDto> getAllCompanies() {
        return companyRepository.findAll().stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    public CompanyDto createCompany(CompanyDto companyDto) {
        Company company = convertToEntity(companyDto);
        company = companyRepository.save(company);
        return convertToDto(company);
    }

    public void deleteCompany(Long id) {
        companyRepository.deleteById(id);
    }

    // ✅ 이름으로 회사 조회
    public Company getCompanyById(Long id) {
        return companyRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("해당 회사를 찾을 수 없습니다: " + id));
    }


    public CompanyDto convertToDto(Company company) {
        return CompanyDto.builder()
                .id(company.getId())
                .name(company.getName())
                .content(company.getContent())
                .address(company.getAddress())
                .since(company.getSince())
                .benefits(company.getBenefits())
                .website(company.getWebsite())
                .industry(company.getIndustry())
                .ceo(company.getCeo())
                .photo(company.getPhoto())
                .build();
    }

    private Company convertToEntity(CompanyDto dto) {
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
}
