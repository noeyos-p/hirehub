package com.we.hirehub.controller.admin;

import com.we.hirehub.entity.Benefits;
import com.we.hirehub.entity.Company;
import com.we.hirehub.service.common.S3Service;
import com.we.hirehub.service.admin.CompanyAdminService;
import com.we.hirehub.service.support.KakaoMapService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@RestController
@RequestMapping("/api/admin/company-management")
@RequiredArgsConstructor
public class CompanyAdminController {

    private final CompanyAdminService companyService;
    private final S3Service s3Service;
    private final KakaoMapService kakaoMapService;

    // 공통: Company → Map 변환 + benefits 포함
    private Map<String, Object> addBenefitsToCompany(Company company) {
        Map<String, Object> result = new HashMap<>();
        result.put("id", company.getId());
        result.put("name", company.getName());
        result.put("content", company.getContent());
        result.put("address", company.getAddress());
        result.put("since", company.getSince());
        result.put("website", company.getWebsite());
        result.put("industry", company.getIndustry());
        result.put("ceo", company.getCeo());
        result.put("photo", company.getPhoto());
        result.put("count", company.getCount());
        result.put("companyType", company.getCompanyType());
        result.put("lat", company.getLat());
        result.put("lng", company.getLng());

        List<String> benefits = companyService.getBenefitsByCompanyId(company.getId())
                .stream().map(Benefits::getName).collect(Collectors.toList());
        result.put("benefitsList", benefits);

        return result;
    }

    // 전체 조회
    @GetMapping
    public ResponseEntity<?> getAllCompanies(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "id") String sortBy,
            @RequestParam(defaultValue = "DESC") Sort.Direction direction,
            @RequestParam(required = false) String keyword
    ) {
        try {
            Pageable pageable = PageRequest.of(page, size, Sort.by(direction, sortBy));
            Page<Company> companies =
                    (keyword != null && !keyword.isBlank())
                            ? companyService.searchCompanies(keyword.trim(), pageable)
                            : companyService.getAllCompanies(pageable);

            List<Map<String, Object>> list = companies.getContent()
                    .stream().map(this::addBenefitsToCompany).collect(Collectors.toList());

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", list);
            response.put("totalElements", companies.getTotalElements());
            response.put("totalPages", companies.getTotalPages());
            response.put("currentPage", page);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("기업 조회 실패", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(error("기업 목록 조회 중 오류 발생"));
        }
    }

    // 등록
    @PostMapping
    public ResponseEntity<?> createCompany(@RequestBody Map<String, Object> body) {
        try {
            Company c = new Company();
            c.setName((String) body.get("name"));
            c.setContent((String) body.get("content"));
            c.setAddress((String) body.get("address"));
            c.setSince(parseInt(body.get("since")));
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
                    .body(success("기업 등록 성공", addBenefitsToCompany(saved)));

        } catch (Exception e) {
            log.error("기업 등록 실패", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(error("기업 등록 실패: " + e.getMessage()));
        }
    }

    // 수정
    @PutMapping("/{companyId}")
    public ResponseEntity<?> updateCompany(
            @PathVariable Long companyId,
            @RequestBody Map<String, Object> body
    ) {
        try {
            Company update = new Company();
            update.setName((String) body.get("name"));
            update.setContent((String) body.get("content"));
            update.setAddress((String) body.get("address"));  // 상세주소 포함 ❌ (프론트에서 분리)
            update.setSince(parseInt(body.get("since")));
            update.setWebsite((String) body.get("website"));
            update.setIndustry((String) body.get("industry"));
            update.setCeo((String) body.get("ceo"));
            update.setPhoto((String) body.get("photo"));
            update.setCount((String) body.get("count"));
            update.setCompanyType((String) body.get("companyType"));

            List<String> benefits = (List<String>) body.get("benefitsList");

            Company saved = companyService.updateCompany(companyId, update, benefits);

            return ResponseEntity.ok(success("기업 수정 완료", addBenefitsToCompany(saved)));

        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error(e.getMessage()));
        } catch (Exception e) {
            log.error("기업 수정 중 오류", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(error("기업 수정 실패"));
        }
    }

    // 삭제
    @DeleteMapping("/{companyId}")
    public ResponseEntity<?> deleteCompany(@PathVariable Long companyId) {
        try {
            companyService.deleteCompany(companyId);
            return ResponseEntity.ok(success("기업 삭제 완료", Map.of("deletedCompanyId", companyId)));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(error("기업 삭제 실패: " + e.getMessage()));
        }
    }

    // 이미지 업로드
    @PostMapping("/{companyId}/image")
    public ResponseEntity<?> uploadCompanyImage(
            @PathVariable Long companyId,
            @RequestParam("file") MultipartFile file
    ) {
        try {
            String url = s3Service.uploadCompanyPhoto(file, companyId);
            Company updated = companyService.updateCompanyPhoto(companyId, url);

            return ResponseEntity.ok(success("이미지 업로드 성공", Map.of(
                    "fileUrl", url,
                    "company", addBenefitsToCompany(updated)
            )));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(error("업로드 실패: " + e.getMessage()));
        }
    }

    // 이미지 삭제
    @DeleteMapping("/{companyId}/image")
    public ResponseEntity<?> deleteCompanyImage(@PathVariable Long companyId) {
        try {
            Company company = companyService.getCompanyById(companyId);

            if (company.getPhoto() == null || company.getPhoto().isBlank()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(error("삭제할 이미지가 없습니다."));
            }

            s3Service.deleteFile(company.getPhoto());
            companyService.updateCompanyPhoto(companyId, null);

            return ResponseEntity.ok(success("이미지 삭제 완료", null));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(error("이미지 삭제 실패: " + e.getMessage()));
        }
    }

    private Integer parseInt(Object obj) {
        try { return obj == null ? null : Integer.parseInt(obj.toString()); }
        catch (Exception e) { return null; }
    }

    private Map<String, Object> success(String msg, Object data) {
        Map<String, Object> r = new HashMap<>();
        r.put("success", true);
        r.put("message", msg);
        r.put("data", data);
        return r;
    }

    private Map<String, Object> error(String msg) {
        Map<String, Object> r = new HashMap<>();
        r.put("success", false);
        r.put("message", msg);
        return r;
    }
}
