package com.we.hirehub.controller.admin;

import com.we.hirehub.entity.Benefits;
import com.we.hirehub.entity.Company;
import com.we.hirehub.service.admin.CompanyAdminService;
import com.we.hirehub.service.common.S3Service;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.*;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@RestController
@RequestMapping("/api/admin/company-management")
@RequiredArgsConstructor
public class CompanyAdminController {

    private final CompanyAdminService companyService;
    private final S3Service s3Service;

    // 변환기
    private Map<String, Object> toMap(Company c) {
        Map<String, Object> m = new HashMap<>();
        m.put("id", c.getId());
        m.put("name", c.getName());
        m.put("content", c.getContent());
        m.put("address", c.getAddress());
        m.put("since", c.getSince());
        m.put("website", c.getWebsite());
        m.put("industry", c.getIndustry());
        m.put("ceo", c.getCeo());
        m.put("photo", c.getPhoto());
        m.put("count", c.getCount());
        m.put("companyType", c.getCompanyType());
        m.put("lat", c.getLat());
        m.put("lng", c.getLng());

        List<String> benefits = companyService.getBenefitsByCompanyId(c.getId())
                .stream().map(Benefits::getName).collect(Collectors.toList());
        m.put("benefitsList", benefits);

        return m;
    }

    // 전체 조회
    @GetMapping
    public ResponseEntity<?> getCompanies(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "id") String sortBy,
            @RequestParam(defaultValue = "DESC") Sort.Direction direction,
            @RequestParam(required = false) String keyword
    ) {

        Pageable pageable = PageRequest.of(page, size, Sort.by(direction, sortBy));

        Page<Company> list =
                (keyword == null || keyword.isBlank())
                        ? companyService.getAllCompanies(pageable)
                        : companyService.searchCompanies(keyword.trim(), pageable);

        return ResponseEntity.ok(
                Map.of(
                        "success", true,
                        "data", list.getContent().stream().map(this::toMap).collect(Collectors.toList()),
                        "totalElements", list.getTotalElements(),
                        "totalPages", list.getTotalPages(),
                        "currentPage", page
                )
        );
    }

    // 생성
    @PostMapping
    public ResponseEntity<?> createCompany(@RequestBody Map<String, Object> body) {

        Company c = new Company();
        c.setName((String) body.get("name"));
        c.setContent((String) body.get("content"));
        c.setAddress((String) body.get("address"));
        c.setSince(body.get("since") != null ? Integer.parseInt(body.get("since").toString()) : null);
        c.setWebsite((String) body.get("website"));
        c.setIndustry((String) body.get("industry"));
        c.setCeo((String) body.get("ceo"));
        c.setPhoto((String) body.get("photo"));
        c.setCount((String) body.get("count"));
        c.setCompanyType((String) body.get("companyType"));

        Company saved = companyService.createCompany(c);

        List<String> benefits = (List<String>) body.get("benefitsList");
        companyService.saveBenefits(benefits, saved);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(Map.of("success", true, "data", toMap(saved)));
    }

    // 수정
    @PutMapping("/{id}")
    public ResponseEntity<?> updateCompany(
            @PathVariable Long id,
            @RequestBody Map<String, Object> body
    ) {
        Company c = new Company();
        c.setName((String) body.get("name"));
        c.setContent((String) body.get("content"));
        c.setAddress((String) body.get("address"));
        c.setSince(body.get("since") != null ? Integer.parseInt(body.get("since").toString()) : null);
        c.setWebsite((String) body.get("website"));
        c.setIndustry((String) body.get("industry"));
        c.setCeo((String) body.get("ceo"));
        c.setPhoto((String) body.get("photo"));
        c.setCount((String) body.get("count"));
        c.setCompanyType((String) body.get("companyType"));

        List<String> benefits = (List<String>) body.get("benefitsList");

        Company saved = companyService.updateCompany(id, c, benefits);

        return ResponseEntity.ok(Map.of("success", true, "data", toMap(saved)));
    }

    // 이미지 업로드
    @PostMapping("/{companyId}/image")
    public ResponseEntity<?> uploadCompanyImage(
            @PathVariable Long companyId,
            @RequestParam("file") MultipartFile file
    ) {
        try {
            String fileUrl = s3Service.uploadCompanyPhoto(file, companyId);
            Company updated = companyService.updateCompanyPhoto(companyId, fileUrl);

            return ResponseEntity.ok(
                    Map.of(
                            "success", true,
                            "message", "이미지 업로드 성공",
                            "fileUrl", fileUrl,     // 🔥 프론트 규칙
                            "company", updated
                    )
            );

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("success", false, "message", "업로드 실패: " + e.getMessage()));
        }
    }


    // 삭제
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteCompany(@PathVariable Long id) {
        companyService.deleteCompany(id);
        return ResponseEntity.ok(Map.of("success", true));
    }
}
