package com.we.hirehub.service;

import com.we.hirehub.dto.company.CompanyDto;
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
                .map(CompanyDto::toDto)
                .collect(Collectors.toList());
    }

    public CompanyDto createCompany(CompanyDto companyDto) {
        Company company = CompanyDto.toEntity(companyDto);
        company = companyRepository.save(company);
        return CompanyDto.toDto(company);
    }

    public void deleteCompany(Long id) {
        companyRepository.deleteById(id);
    }

    // ✅ 이름으로 회사 조회
    public Company getCompanyById(Long id) {
        return companyRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("해당 회사를 찾을 수 없습니다: " + id));
    }
}
