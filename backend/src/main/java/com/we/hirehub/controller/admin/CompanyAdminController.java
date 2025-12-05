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
import org.springframework.web.multipart.MultipartFile; // ✅ 추가

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * 관리자 - 기업 관리 API
 *
 * 기본 경로: /api/admin/company-management
 * 권한: ADMIN 역할
 */
@Slf4j
@RestController
@RequestMapping("/api/admin/company-management")
@RequiredArgsConstructor
public class CompanyAdminController {

    private final CompanyAdminService companyService;
    private final S3Service s3Service;
    private final KakaoMapService kakaoMapService;

    // Helper: Company에 benefitsList 추가
    private Map<String, Object> addBenefitsToCompany(Company company) {
        Map<String, Object> companyData = new HashMap<>();
        companyData.put("id", company.getId());
        companyData.put("name", company.getName());
        companyData.put("content", company.getContent());
        companyData.put("address", company.getAddress());
        companyData.put("since", company.getSince());
        companyData.put("website", company.getWebsite());
        companyData.put("industry", company.getIndustry());
        companyData.put("ceo", company.getCeo());
        companyData.put("photo", company.getPhoto());
        companyData.put("count", company.getCount());
        companyData.put("companyType", company.getCompanyType());
        companyData.put("lat", company.getLat());
        companyData.put("lng", company.getLng());

        List<String> benefitsList = companyService.getBenefitsByCompanyId(company.getId())
            .stream()
            .map(Benefits::getName)
            .collect(Collectors.toList());
        companyData.put("benefitsList", benefitsList);

        return companyData;
    }

    // =================== 조회 ===================
    @GetMapping
    public ResponseEntity<?> getAllCompanies(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "id") String sortBy,
            @RequestParam(defaultValue = "DESC") Sort.Direction direction,
            @RequestParam(required = false) String keyword) {

        try {
            Pageable pageable = PageRequest.of(page, size, Sort.by(direction, sortBy));
            Page<Company> companies;

            if (keyword != null && !keyword.trim().isEmpty()) {
                companies = companyService.searchCompanies(keyword.trim(), pageable);
            } else {
                companies = companyService.getAllCompanies(pageable);
            }

            List<Map<String, Object>> companiesWithBenefits = companies.getContent().stream()
                .map(this::addBenefitsToCompany)
                .collect(Collectors.toList());

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "기업 조회 성공");
            response.put("data", companiesWithBenefits);
            response.put("totalElements", companies.getTotalElements());
            response.put("totalPages", companies.getTotalPages());
            response.put("currentPage", page);

            log.info("기업 조회 성공 - 총 {} 개", companies.getTotalElements());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("기업 조회 실패", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse(e.getMessage()));
        }
    }

    // =================== 등록 ===================
    @PostMapping
    public ResponseEntity<?> createCompany(@RequestBody Map<String, Object> requestData) {
        try {
            Company company = new Company();
            company.setName((String) requestData.get("name"));
            company.setContent((String) requestData.get("content"));
            company.setAddress((String) requestData.get("address"));
            company.setSince(requestData.get("since") != null ? Integer.parseInt(requestData.get("since").toString()) : null);
            company.setWebsite((String) requestData.get("website"));
            company.setIndustry((String) requestData.get("industry"));
            company.setCeo((String) requestData.get("ceo"));
            company.setPhoto((String) requestData.get("photo"));
            company.setCount((String) requestData.get("count"));
            company.setCompanyType((String) requestData.get("companyType"));

            if (company.getName() == null || company.getName().trim().isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(createErrorResponse("기업명이 필요합니다"));
            }

            Company createdCompany = companyService.createCompany(company);

            // benefitsList 처리
            @SuppressWarnings("unchecked")
            List<String> benefitsList = (List<String>) requestData.get("benefitsList");
            companyService.saveBenefits(benefitsList, createdCompany);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "기업 등록 성공");
            response.put("data", addBenefitsToCompany(createdCompany));

            log.info("기업 등록 완료 - {}", createdCompany.getName());
            return ResponseEntity.status(HttpStatus.CREATED).body(response);

        } catch (Exception e) {
            log.error("기업 등록 실패", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse(e.getMessage()));
        }
    }

    // =================== 수정 ===================
    @PutMapping("/{companyId}")
    public ResponseEntity<?> updateCompany(
            @PathVariable Long companyId,
            @RequestBody Map<String, Object> requestData) {

        try {
            if (companyId == null || companyId <= 0) {
                return ResponseEntity.badRequest()
                        .body(createErrorResponse("유효한 기업 ID가 필요합니다"));
            }

            Company updateData = new Company();
            if (requestData.containsKey("name")) updateData.setName((String) requestData.get("name"));
            if (requestData.containsKey("content")) updateData.setContent((String) requestData.get("content"));
            if (requestData.containsKey("address")) updateData.setAddress((String) requestData.get("address"));
            if (requestData.containsKey("since")) updateData.setSince(Integer.parseInt(requestData.get("since").toString()));
            if (requestData.containsKey("website")) updateData.setWebsite((String) requestData.get("website"));
            if (requestData.containsKey("industry")) updateData.setIndustry((String) requestData.get("industry"));
            if (requestData.containsKey("ceo")) updateData.setCeo((String) requestData.get("ceo"));
            if (requestData.containsKey("photo")) updateData.setPhoto((String) requestData.get("photo"));
            if (requestData.containsKey("count")) updateData.setCount((String) requestData.get("count"));
            if (requestData.containsKey("companyType")) updateData.setCompanyType((String) requestData.get("companyType"));

            // benefitsList 처리
            List<String> benefitsList = null;
            if (requestData.containsKey("benefitsList")) {
                @SuppressWarnings("unchecked")
                List<String> list = (List<String>) requestData.get("benefitsList");
                benefitsList = list;
            }

            Company updatedCompany = companyService.updateCompany(companyId, updateData, benefitsList);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "기업 정보 수정 완료");
            response.put("data", addBenefitsToCompany(updatedCompany));

            log.info("기업 정보 수정 완료 - companyId: {}", companyId);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            log.warn("기업 수정 실패: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(createErrorResponse(e.getMessage()));
        } catch (Exception e) {
            log.error("기업 수정 중 오류", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse(e.getMessage()));
        }
    }

    // =================== 삭제 ===================
    @DeleteMapping("/{companyId}")
    public ResponseEntity<?> deleteCompany(@PathVariable Long companyId) {
        try {
            if (companyId == null || companyId <= 0) {
                return ResponseEntity.badRequest()
                        .body(createErrorResponse("유효한 기업 ID가 필요합니다"));
            }

            Company company = companyService.getCompanyById(companyId);

            if (company.getPhoto() != null && !company.getPhoto().isEmpty()) {
                try {
                    s3Service.deleteFile(company.getPhoto());
                    log.info("S3 로고 파일 삭제 완료: {}", company.getPhoto());
                } catch (Exception e) {
                    log.error("S3 파일 삭제 실패: {}", e.getMessage());
                }
            }

            companyService.deleteCompany(companyId);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "기업 삭제 완료");
            response.put("deletedCompanyId", companyId);

            log.info("기업 삭제 완료 - companyId: {}", companyId);
            return ResponseEntity.ok(response);

        } catch (IllegalArgumentException e) {
            log.warn("기업 삭제 실패: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(createErrorResponse(e.getMessage()));
        } catch (Exception e) {
            log.error("기업 삭제 중 오류", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse(e.getMessage()));
        }
    }

    // =================== 기업 이미지 업로드 ===================
    @PostMapping("/{companyId}/image")
    public ResponseEntity<Map<String, Object>> uploadCompanyImage(
            @PathVariable("companyId") Long companyId,
            @RequestParam("file") MultipartFile file) {

        try {
            log.info("기업 이미지 업로드 요청 - companyId: {}, fileName: {}", companyId, file.getOriginalFilename());

            // 1️⃣ AWS S3 업로드
            String fileUrl = s3Service.uploadCompanyPhoto(file, companyId);

            // 2️⃣ DB에 URL 저장
            Company company = companyService.updateCompanyPhoto(companyId, fileUrl);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "기업 이미지 업로드 성공");
            response.put("fileUrl", fileUrl);
            response.put("company", addBenefitsToCompany(company));

            log.info("기업 이미지 업로드 성공 - URL: {}", fileUrl);
            return ResponseEntity.ok(response);

        } catch (IllegalArgumentException e) {
            log.error("유효성 검증 실패: {}", e.getMessage());
            return ResponseEntity.badRequest()
                    .body(createErrorResponse(e.getMessage()));
        } catch (Exception e) {
            log.error("기업 이미지 업로드 실패", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse("업로드 실패: " + e.getMessage()));
        }
    }

    // =================== ✅ 기업 이미지 삭제 ===================
    @DeleteMapping("/{companyId}/image")
    public ResponseEntity<?> deleteCompanyImage(@PathVariable Long companyId) {
        try {
            Company company = companyService.getCompanyById(companyId);

            if (company == null || company.getPhoto() == null || company.getPhoto().isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(createErrorResponse("삭제할 이미지가 없습니다."));
            }

            // 1️⃣ S3 파일 삭제
            s3Service.deleteFile(company.getPhoto());
            log.info("S3 이미지 삭제 완료: {}", company.getPhoto());

            // 2️⃣ DB photo 필드 null 처리
            companyService.updateCompanyPhoto(companyId, null);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "기업 이미지 삭제 완료");
            return ResponseEntity.ok(response);

        } catch (IllegalArgumentException e) {
            log.warn("이미지 삭제 실패: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(createErrorResponse(e.getMessage()));
        } catch (Exception e) {
            log.error("이미지 삭제 중 오류", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse("이미지 삭제 중 오류: " + e.getMessage()));
        }
    }

    // =================== 공통 에러 응답 ===================
    private Map<String, Object> createErrorResponse(String message) {
        Map<String, Object> response = new HashMap<>();
        response.put("success", false);
        response.put("message", message);
        return response;
    }
}
