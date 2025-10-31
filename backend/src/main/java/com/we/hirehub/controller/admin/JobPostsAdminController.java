package com.we.hirehub.controller.admin;

import com.we.hirehub.dto.JobPostsDto;
import com.we.hirehub.entity.JobPosts;
import com.we.hirehub.service.S3Service;
import com.we.hirehub.service.admin.JobPostsAdminService;
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
import java.util.Map;

/**
 * 관리자 - 공고 관리 API
 *
 * 기본 경로: /api/admin/job-management
 * 권한: ADMIN 역할
 */
@Slf4j
@RestController
@RequestMapping("/api/admin/job-management")
@RequiredArgsConstructor
public class JobPostsAdminController {

    private final JobPostsAdminService jobPostsService;
    private final S3Service s3Service;

    // ============ 조회 ============

    /**
     * 모든 공고 조회 (페이징)
     * GET /api/admin/job-management?page=0&size=10
     */
    @GetMapping
    public ResponseEntity<?> getAllJobPosts(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "id") String sortBy,
            @RequestParam(defaultValue = "DESC") Sort.Direction direction) {

        try {
            Pageable pageable = PageRequest.of(page, size, Sort.by(direction, sortBy));
            Page<JobPostsDto> jobPosts = jobPostsService.getAllJobPosts(pageable);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "공고 조회 성공");
            response.put("data", jobPosts.getContent());
            response.put("totalElements", jobPosts.getTotalElements());
            response.put("totalPages", jobPosts.getTotalPages());
            response.put("currentPage", page);

            log.info("공고 조회 성공 - 총 {} 개", jobPosts.getTotalElements());
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("공고 조회 실패", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse(e.getMessage()));
        }
    }

    // ============ 생성 ============

    /**
     * 공고 등록
     * POST /api/admin/job-management
     */
    /*@PostMapping
    public ResponseEntity<?> createJobPost(@RequestBody JobPosts jobPost) {

        try {
            if (jobPost.getTitle() == null || jobPost.getTitle().trim().isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(createErrorResponse("공고 제목이 필요합니다"));
            }

            JobPostsDto createdJobPost = jobPostsService.createJobPost(jobPost);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "공고 등록 성공");
            response.put("data", createdJobPost);

            log.info("공고 등록 완료 - {}", createdJobPost.getTitle());
            return ResponseEntity.status(HttpStatus.CREATED).body(response);

        } catch (IllegalArgumentException e) {
            log.warn("공고 등록 실패: {}", e.getMessage());
            return ResponseEntity.badRequest()
                    .body(createErrorResponse(e.getMessage()));
        } catch (Exception e) {
            e.printStackTrace();
            log.error("공고 등록 실패", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse(e.getMessage()));
        }
    }*/
    @PostMapping
    public ResponseEntity<?> createJobPost(@RequestBody JobPosts jobPost) {

        log.info("=== 🚀 공고 등록 요청 받음 ===");
        log.info("1️⃣ 제목: {}", jobPost.getTitle());
        log.info("2️⃣ 내용: {}", jobPost.getContent());
        log.info("3️⃣ 회사 정보: {}", jobPost.getCompany());
        log.info("4️⃣ 회사 ID: {}", jobPost.getCompany() != null ? jobPost.getCompany().getId() : "NULL");
        log.info("5️⃣ 위치: {}", jobPost.getLocation());
        log.info("6️⃣ 시작일: {}, 마감일: {}", jobPost.getStartAt(), jobPost.getEndAt());

        try {
            if (jobPost.getTitle() == null || jobPost.getTitle().trim().isEmpty()) {
                log.warn("❌ 제목이 비어있음");
                return ResponseEntity.badRequest()
                        .body(createErrorResponse("공고 제목이 필요합니다"));
            }

            log.info("7️⃣ Service 호출 시작...");
            JobPostsDto createdJobPost = jobPostsService.createJobPost(jobPost);

            log.info("8️⃣ Service 호출 완료!");
            log.info("9️⃣ 생성된 공고 ID: {}", createdJobPost.getId());
            log.info("🔟 생성된 공고 제목: {}", createdJobPost.getTitle());

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "공고 등록 성공");
            response.put("data", createdJobPost);

            log.info("✅ 공고 등록 완료 - {}", createdJobPost.getTitle());
            log.info("=== 응답 전송 ===");
            return ResponseEntity.status(HttpStatus.CREATED).body(response);

        } catch (IllegalArgumentException e) {
            log.error("❌ IllegalArgumentException 발생: {}", e.getMessage());
            e.printStackTrace();
            return ResponseEntity.badRequest()
                    .body(createErrorResponse(e.getMessage()));
        } catch (Exception e) {
            log.error("❌ Exception 발생: {}", e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse(e.getMessage()));
        }
    }

    // ============ 이미지 업로드 (공고 생성 직후) ============

    /**
     * 공고 이미지 업로드
     * POST /api/admin/job-management/jobpost-image
     */
    @PostMapping("/jobpost-image")
    public ResponseEntity<Map<String, Object>> uploadJobPostImage(
            @RequestParam("jobPostId") Long jobPostId,
            @RequestParam("file") MultipartFile file) {

        try {
            log.info("Uploading job post image - jobPostId: {}, fileName: {}",
                    jobPostId, file.getOriginalFilename());

            // 1️⃣ S3 업로드
            String fileUrl = s3Service.uploadJobPostImage(file, jobPostId);

            // 2️⃣ DB 업데이트
            jobPostsService.updateJobPhoto(jobPostId, fileUrl);

            // 3️⃣ 응답 반환
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "공고 이미지 업로드 성공");
            response.put("fileUrl", fileUrl);
            response.put("jobPostId", jobPostId);

            log.info("Job post image uploaded successfully: {}", fileUrl);
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("Upload failed", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse("업로드 실패: " + e.getMessage()));
        }
    }

    // ============ 수정 ============

    /**
     * 공고 정보 수정
     * PUT /api/admin/job-management/{jobPostId}
     */
    @PutMapping("/{jobPostId}")
    public ResponseEntity<?> updateJobPost(
            @PathVariable Long jobPostId,
            @RequestBody JobPosts updateData) {

        try {
            if (jobPostId == null || jobPostId <= 0) {
                return ResponseEntity.badRequest()
                        .body(createErrorResponse("유효한 공고 ID가 필요합니다"));
            }

            JobPostsDto updatedJobPost = jobPostsService.updateJobPost(jobPostId, updateData);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "공고 정보 수정 완료");
            response.put("data", updatedJobPost);

            log.info("공고 정보 수정 완료 - jobPostId: {}", jobPostId);
            return ResponseEntity.ok(response);

        } catch (IllegalArgumentException e) {
            log.warn("공고 수정 실패: {}", e.getMessage());
            return ResponseEntity.badRequest()
                    .body(createErrorResponse(e.getMessage()));
        } catch (Exception e) {
            log.error("공고 수정 중 오류", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse(e.getMessage()));
        }
    }

    // ============ 삭제 ============

    /**
     * 공고 삭제
     * DELETE /api/admin/job-management/{jobPostId}
     */
    @DeleteMapping("/{jobPostId}")
    public ResponseEntity<?> deleteJobPost(@PathVariable Long jobPostId) {
        try {
            if (jobPostId == null || jobPostId <= 0) {
                return ResponseEntity.badRequest()
                        .body(createErrorResponse("유효한 공고 ID가 필요합니다"));
            }

            // 1️⃣ DB에서 공고 조회
            JobPostsDto jobPost = jobPostsService.getJobPostById(jobPostId);

            // 2️⃣ S3에 업로드된 공고 사진이 있으면 삭제
            if (jobPost.getPhoto() != null && !jobPost.getPhoto().isEmpty()) {
                try {
                    s3Service.deleteFile(jobPost.getPhoto());
                    log.info("S3 공고 사진 삭제 완료: {}", jobPost.getPhoto());
                } catch (Exception e) {
                    log.error("S3 공고 사진 삭제 실패: {}", jobPost.getPhoto(), e);
                }
            }

            // 3️⃣ DB에서 공고 삭제
            jobPostsService.deleteJobPost(jobPostId);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "공고 삭제 완료");
            response.put("deletedJobPostId", jobPostId);

            log.info("공고 삭제 완료 - jobPostId: {}", jobPostId);
            return ResponseEntity.ok(response);

        } catch (IllegalArgumentException e) {
            log.warn("공고 삭제 실패: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(createErrorResponse(e.getMessage()));
        } catch (Exception e) {
            log.error("공고 삭제 중 오류", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse(e.getMessage()));
        }
    }

    /**
     * 공고 이미지 삭제
     * DELETE /api/admin/job-management/{jobPostId}/image
     */
    @DeleteMapping("/{jobPostId}/image")
    public ResponseEntity<?> deleteJobPostImage(@PathVariable Long jobPostId) {
        try {
            JobPostsDto jobPost = jobPostsService.getJobPostById(jobPostId);

            if (jobPost == null || jobPost.getPhoto() == null || jobPost.getPhoto().isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(createErrorResponse("삭제할 이미지가 없습니다."));
            }

            // 1️⃣ S3 파일 삭제
            s3Service.deleteFile(jobPost.getPhoto());
            log.info("S3 이미지 삭제 완료: {}", jobPost.getPhoto());

            // 2️⃣ DB에서 photo 필드 제거
            jobPostsService.updateJobPhoto(jobPostId, null);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "이미지 삭제 완료");
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

    /**
     * 에러 응답 생성
     */
    private Map<String, Object> createErrorResponse(String message) {
        Map<String, Object> response = new HashMap<>();
        response.put("success", false);
        response.put("message", message);
        return response;
    }
}