package com.we.hirehub.controller.admin;

import com.we.hirehub.entity.Company;
import com.we.hirehub.service.S3Service;
import com.we.hirehub.service.admin.CompanyAdminService;
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
import java.util.Map;

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

    // =================== 조회 ===================
    @GetMapping
    public ResponseEntity<?> getAllCompanies(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "id") String sortBy,
            @RequestParam(defaultValue = "DESC") Sort.Direction direction) {

        try {
            Pageable pageable = PageRequest.of(page, size, Sort.by(direction, sortBy));
            Page<Company> companies = companyService.getAllCompanies(pageable);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "기업 조회 성공");
            response.put("data", companies.getContent());
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
    public ResponseEntity<?> createCompany(@RequestBody Company company) {
        try {
            if (company.getName() == null || company.getName().trim().isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(createErrorResponse("기업명이 필요합니다"));
            }

            Company createdCompany = companyService.createCompany(company);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "기업 등록 성공");
            response.put("data", createdCompany);

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
            @RequestBody Company updateData) {

        try {
            if (companyId == null || companyId <= 0) {
                return ResponseEntity.badRequest()
                        .body(createErrorResponse("유효한 기업 ID가 필요합니다"));
            }

            Company updatedCompany = companyService.updateCompany(companyId, updateData);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "기업 정보 수정 완료");
            response.put("data", updatedCompany);

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
            response.put("company", company);

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
