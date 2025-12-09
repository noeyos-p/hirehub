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

@Slf4j
@RestController
@RequestMapping("/api/admin/job-management")
@RequiredArgsConstructor
public class JobPostsAdminController {

    private final JobPostsAdminService jobPostsService;
    private final JobPostsRepository jobPostRepository;
    private final S3Service s3Service;
    private final ObjectMapper objectMapper;

    // ============ 조회 ============

    @GetMapping
    public ResponseEntity<?> getAllJobPosts(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "id") String sortBy,
            @RequestParam(defaultValue = "DESC") Sort.Direction direction,
            @RequestParam(required = false) String keyword
    ) {

        try {
            Pageable pageable = PageRequest.of(page, size, Sort.by(direction, sortBy));
            Page<JobPostsDto> jobPosts = jobPostsService.getAllJobPosts(pageable, keyword);

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

                        // ⭐ 추가된 부분 — 지도 좌표 반환
                        jobData.put("lat", jobPost.getLat());
                        jobData.put("lng", jobPost.getLng());

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

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("공고 조회 실패", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse(e.getMessage()));
        }
    }

    // ============ 생성 ============

    @PostMapping
    public ResponseEntity<?> createJobPost(@RequestBody Map<String, Object> requestData) {
        log.info("=== 🚀 공고 등록 요청 받음 ===");

        try {
            JobPosts jobPost = new JobPosts();
            jobPost.setTitle((String) requestData.get("title"));
            jobPost.setContent((String) requestData.get("content"));

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
            jobPost.setViews(0L);

            if (requestData.get("company") != null) {
                Map<String, Object> companyData = (Map<String, Object>) requestData.get("company");
                com.we.hirehub.entity.Company company = new com.we.hirehub.entity.Company();
                company.setId(Long.parseLong(companyData.get("id").toString()));
                jobPost.setCompany(company);
            }

            if (jobPost.getPhoto() != null && jobPost.getPhoto().trim().isEmpty()) {
                jobPost.setPhoto(null);
            }

            JobPostsDto createdJobPost = jobPostsService.createJobPost(jobPost);

            List<String> techStackList = (List<String>) requestData.get("techStackList");
            JobPosts savedJobPost = new JobPosts();
            savedJobPost.setId(createdJobPost.getId());
            jobPostsService.saveTechStacks(techStackList, savedJobPost);

            List<String> savedTechStacks = jobPostsService.getTechStacksByJobPostId(createdJobPost.getId())
                    .stream()
                    .map(TechStack::getName)
                    .collect(Collectors.toList());

            Map<String, Object> responseData = new HashMap<>();
            responseData.putAll(objectMapper.convertValue(createdJobPost, Map.class));
            responseData.put("techStackList", savedTechStacks);

            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(Map.of("success", true, "message", "공고 등록 성공", "data", responseData));

        } catch (Exception e) {
            log.error("공고 등록 실패", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse(e.getMessage()));
        }
    }
    private Map<String, Object> createErrorResponse(String message) {
        Map<String, Object> response = new HashMap<>();
        response.put("success", false);
        response.put("message", message);
        return response;
    }
}

// (이하 나머지 메서드 동일 — lat/lng 관련 수정 없음, 그대로 유지)
