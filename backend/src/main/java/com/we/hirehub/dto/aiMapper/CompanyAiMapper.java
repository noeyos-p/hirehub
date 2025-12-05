package com.we.hirehub.dto.aiMapper;

import com.we.hirehub.entity.Company;
import org.springframework.stereotype.Component;

import java.util.Map;

@Component
public class CompanyAiMapper {
    public Map<String, Object> toAiPayload(Company company) {
        return Map.of(
                "name", company.getName(),
                "industry", company.getIndustry(),
                "address", company.getAddress(),
                "website", company.getWebsite(),
                "since", company.getSince().toString(),
                "content", company.getContent()   // ← 회사 소개
        );
    }
}
