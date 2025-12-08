package com.we.hirehub.controller.admin;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.we.hirehub.dto.support.JobPostsDto;
import com.we.hirehub.entity.JobPosts;
import com.we.hirehub.entity.TechStack;
import com.we.hirehub.repository.JobPostsRepository;
import com.we.hirehub.service.common.S3Service;
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
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

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
    private final JobPostsRepository jobPostRepository; // ✅ [추가]
    private final S3Service s3Service;
    private final ObjectMapper objectMapper; // ✅ Spring's auto-configured ObjectMapper with JSR310 support

    // ============ 조회 ============

    /**
     * 모든 공고 조회 (페이징 + 검색)
     * ✅ [수정] keyword 파라미터 추가됨
     * GET /api/admin/job-management?page=0&size=10&keyword=프론트엔드
     */
    @GetMapping
    public ResponseEntity<?> getAllJobPosts(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "id") String sortBy,
            @RequestParam(defaultValue = "DESC") Sort.Direction direction,
            @RequestParam(required = false) String keyword // ✅ [추가]
    ) {

        try {
            Pageable pageable = PageRequest.of(page, size, Sort.by(direction, sortBy));
            Page<JobPostsDto> jobPosts = jobPostsService.getAllJobPosts(pageable, keyword); // ✅ [수정]

            // 각 공고에 techStackList 추가
            List<Map<String, Object>> jobPostsWithTechStacks = jobPosts.getContent().stream()
                .map(jobPost -> {
                    Map<String, Object> jobData = new HashMap<>();
                    jobData.put("id", jobPost.getId());
                    jobData.put("title", jobPost.getTitle());
                    jobData.put("content", jobPost.getContent());
                    jobData.put("endAt", jobPost.getEndAt());
                    jobData.put("location", jobPost.getLocation());
                    jobData.put("careerLevel", jobPost.getCareerLevel());
                    jobData.put("education", jobPost.getEducation());
                    jobData.put("position", jobPost.getPosition());
                    jobData.put("type", jobPost.getType());
                    jobData.put("photo", jobPost.getPhoto());
                    jobData.put("company", jobPost.getCompany());
                    jobData.put("mainJob", jobPost.getMainJob());
                    jobData.put("qualification", jobPost.getQualification());
                    jobData.put("preference", jobPost.getPreference());
                    jobData.put("hireType", jobPost.getHireType());

                    List<String> techStackList = jobPostsService.getTechStacksByJobPostId(jobPost.getId())
                        .stream()
                        .map(TechStack::getName)
                        .collect(Collectors.toList());
                    jobData.put("techStackList", techStackList);

                    return jobData;
                })
                .collect(Collectors.toList());

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", (keyword == null || keyword.isBlank()) ? "공고 조회 성공" : "검색 결과");
            response.put("data", jobPostsWithTechStacks);
            response.put("totalElements", jobPosts.getTotalElements());
            response.put("totalPages", jobPosts.getTotalPages());
            response.put("currentPage", page);

            log.info("공고 조회 성공 (검색어: {}) - 총 {} 개", keyword, jobPosts.getTotalElements());
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
    @PostMapping
    public ResponseEntity<?> createJobPost(@RequestBody Map<String, Object> requestData) {
        log.info("=== 🚀 공고 등록 요청 받음 ===");

        try {
            JobPosts jobPost = new JobPosts();
            jobPost.setTitle((String) requestData.get("title"));
            jobPost.setContent((String) requestData.get("content"));

            // endAt 처리: null이거나 빈 문자열이면 null로 설정
            String endAtStr = (String) requestData.get("endAt");
            jobPost.setEndAt(endAtStr != null && !endAtStr.trim().isEmpty()
                ? java.time.LocalDate.parse(endAtStr) : null);
            jobPost.setLocation((String) requestData.get("location"));
            jobPost.setCareerLevel((String) requestData.get("careerLevel"));
            jobPost.setEducation((String) requestData.get("education"));
            jobPost.setPosition((String) requestData.get("position"));
            jobPost.setType((String) requestData.get("type"));
            jobPost.setPhoto((String) requestData.get("photo"));
            jobPost.setMainJob((String) requestData.get("mainJob"));
            jobPost.setQualification((String) requestData.get("qualification"));
            jobPost.setPreference((String) requestData.get("preference"));
            jobPost.setHireType((String) requestData.get("hireType"));
            jobPost.setViews(0L); // 조회수 기본값 설정

            // Company 설정
            if (requestData.get("company") != null) {
                @SuppressWarnings("unchecked")
                Map<String, Object> companyData = (Map<String, Object>) requestData.get("company");
                com.we.hirehub.entity.Company company = new com.we.hirehub.entity.Company();
                company.setId(Long.parseLong(companyData.get("id").toString()));
                jobPost.setCompany(company);
            }

            if (jobPost.getTitle() == null || jobPost.getTitle().trim().isEmpty()) {
                return ResponseEntity.badRequest().body(createErrorResponse("공고 제목이 필요합니다"));
            }

            // ✅ photo 값이 비어 있으면 null 처리
            if (jobPost.getPhoto() != null && jobPost.getPhoto().trim().isEmpty()) {
                jobPost.setPhoto(null);
            }

            JobPostsDto createdJobPost = jobPostsService.createJobPost(jobPost);

            // techStackList 처리
            @SuppressWarnings("unchecked")
            List<String> techStackList = (List<String>) requestData.get("techStackList");
            JobPosts savedJobPost = new JobPosts();
            savedJobPost.setId(createdJobPost.getId());
            jobPostsService.saveTechStacks(techStackList, savedJobPost);

            // techStackList 포함하여 응답
            List<String> savedTechStacks = jobPostsService.getTechStacksByJobPostId(createdJobPost.getId())
                .stream()
                .map(TechStack::getName)
                .collect(Collectors.toList());

            Map<String, Object> responseData = new HashMap<>();
            responseData.putAll(objectMapper.convertValue(createdJobPost, Map.class));
            responseData.put("techStackList", savedTechStacks);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "공고 등록 성공");
            response.put("data", responseData);

            return ResponseEntity.status(HttpStatus.CREATED).body(response);

        } catch (Exception e) {
            log.error("공고 등록 실패", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse(e.getMessage()));
        }
    }

    // ============ 이미지 업로드 (공고 생성 직후) ============

    /**
     * 공고 이미지 업로드
     * ✅ [수정] ApiResponse 제거 → ResponseEntity로 일원화
     * POST /api/admin/job-management/jobpost-image
     */
    @PostMapping("/jobpost-image")
    public ResponseEntity<?> uploadJobPostImage(
            @RequestParam("file") MultipartFile file,
            @RequestParam("jobPostId") Long jobPostId
    ) {
        log.info("📸 공고 이미지 업로드 요청: jobPostId={}", jobPostId);
        try {
            JobPosts jobPost = jobPostRepository.findById(jobPostId)
                    .orElseThrow(() -> new IllegalArgumentException("공고를 찾을 수 없습니다."));

            // ✅ 경로 고유화: 공고 ID별 폴더 생성
            String fileUrl = s3Service.uploadJobPostImage(file, jobPostId);

            // ✅ DB에 해당 공고의 photo 필드만 업데이트
            jobPost.setPhoto(fileUrl);
            jobPostRepository.save(jobPost);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "이미지 업로드 완료");
            response.put("fileUrl", fileUrl);
            return ResponseEntity.ok(response);

        } catch (IllegalArgumentException e) {
            log.warn("이미지 업로드 실패: {}", e.getMessage());
            return ResponseEntity.badRequest()
                    .body(createErrorResponse(e.getMessage()));
        } catch (Exception e) {
            log.error("이미지 업로드 중 오류", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse("이미지 업로드 중 오류: " + e.getMessage()));
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
            @RequestBody Map<String, Object> requestData) {

        try {
            if (jobPostId == null || jobPostId <= 0) {
                return ResponseEntity.badRequest()
                        .body(createErrorResponse("유효한 공고 ID가 필요합니다"));
            }

            JobPostsDto updateDto = new JobPostsDto();
            if (requestData.containsKey("title")) updateDto.setTitle((String) requestData.get("title"));
            if (requestData.containsKey("content")) updateDto.setContent((String) requestData.get("content"));

            // endAt 처리
            if (requestData.containsKey("endAt")) {
                String endAtStr = (String) requestData.get("endAt");
                updateDto.setEndAt(endAtStr != null && !endAtStr.trim().isEmpty()
                    ? java.time.LocalDate.parse(endAtStr) : null);
            }
            if (requestData.containsKey("location")) updateDto.setLocation((String) requestData.get("location"));
            if (requestData.containsKey("careerLevel")) updateDto.setCareerLevel((String) requestData.get("careerLevel"));
            if (requestData.containsKey("education")) updateDto.setEducation((String) requestData.get("education"));
            if (requestData.containsKey("position")) updateDto.setPosition((String) requestData.get("position"));
            if (requestData.containsKey("type")) updateDto.setType((String) requestData.get("type"));
            if (requestData.containsKey("photo")) updateDto.setPhoto((String) requestData.get("photo"));
            if (requestData.containsKey("mainJob")) updateDto.setMainJob((String) requestData.get("mainJob"));
            if (requestData.containsKey("qualification")) updateDto.setQualification((String) requestData.get("qualification"));
            if (requestData.containsKey("preference")) updateDto.setPreference((String) requestData.get("preference"));
            if (requestData.containsKey("hireType")) updateDto.setHireType((String) requestData.get("hireType"));

            JobPostsDto updatedJobPost = jobPostsService.updateJobPost(jobPostId, updateDto);

            // techStackList 처리
            if (requestData.containsKey("techStackList")) {
                @SuppressWarnings("unchecked")
                List<String> techStackList = (List<String>) requestData.get("techStackList");
                JobPosts savedJobPost = new JobPosts();
                savedJobPost.setId(jobPostId);
                jobPostsService.updateTechStacks(jobPostId, techStackList, savedJobPost);
            }

            // techStackList 포함하여 응답
            List<String> savedTechStacks = jobPostsService.getTechStacksByJobPostId(jobPostId)
                .stream()
                .map(TechStack::getName)
                .collect(Collectors.toList());

            Map<String, Object> responseData = new HashMap<>();
            responseData.putAll(objectMapper.convertValue(updatedJobPost, Map.class));
            responseData.put("techStackList", savedTechStacks);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "공고 정보 수정 완료");
            response.put("data", responseData);

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

            JobPostsDto jobPost = jobPostsService.getJobPostById(jobPostId);

            if (jobPost.getPhoto() != null && !jobPost.getPhoto().isEmpty()) {
                try {
                    s3Service.deleteFile(jobPost.getPhoto());
                    log.info("S3 공고 사진 삭제 완료: {}", jobPost.getPhoto());
                } catch (Exception e) {
                    log.error("S3 공고 사진 삭제 실패: {}", jobPost.getPhoto(), e);
                }
            }

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

            s3Service.deleteFile(jobPost.getPhoto());
            log.info("S3 이미지 삭제 완료: {}", jobPost.getPhoto());

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

    /** 에러 응답 생성 */
    private Map<String, Object> createErrorResponse(String message) {
        Map<String, Object> response = new HashMap<>();
        response.put("success", false);
        response.put("message", message);
        return response;
    }
}
