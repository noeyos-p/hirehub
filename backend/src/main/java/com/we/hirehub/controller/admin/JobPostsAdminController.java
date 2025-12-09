package com.we.hirehub.controller.admin;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.we.hirehub.dto.support.JobPostsDto;
import com.we.hirehub.entity.JobPosts;
import com.we.hirehub.entity.TechStack;
import com.we.hirehub.service.admin.JobPostsAdminService;
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
@RequestMapping("/api/admin/job-management")
@RequiredArgsConstructor
public class JobPostsAdminController {

    private final JobPostsAdminService jobPostsService;
    private final S3Service s3Service;
    private final ObjectMapper objectMapper;

    // ===============================
    // 🔍 공고 조회
    // ===============================
    @GetMapping
    public ResponseEntity<?> getAllJobPosts(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "id") String sortBy,
            @RequestParam(defaultValue = "DESC") Sort.Direction direction,
            @RequestParam(required = false) String keyword
    ) {

        Pageable pageable = PageRequest.of(page, size, Sort.by(direction, sortBy));
        Page<JobPostsDto> jobPosts = jobPostsService.getAllJobPosts(pageable, keyword);

        List<Map<String, Object>> list = jobPosts.getContent().stream().map(job -> {
            Map<String, Object> m = new HashMap<>();
            m.put("id", job.getId());
            m.put("title", job.getTitle());
            m.put("content", job.getContent());
            m.put("endAt", job.getEndAt());
            m.put("location", job.getLocation());
            m.put("careerLevel", job.getCareerLevel());
            m.put("education", job.getEducation());
            m.put("position", job.getPosition());
            m.put("type", job.getType());
            m.put("photo", job.getPhoto());
            m.put("company", job.getCompany());
            m.put("mainJob", job.getMainJob());
            m.put("qualification", job.getQualification());
            m.put("preference", job.getPreference());
            m.put("hireType", job.getHireType());
            m.put("lat", job.getLat());
            m.put("lng", job.getLng());

            List<String> techList = jobPostsService.getTechStacksByJobPostId(job.getId())
                    .stream().map(TechStack::getName).collect(Collectors.toList());
            m.put("techStackList", techList);

            return m;
        }).collect(Collectors.toList());

        return ResponseEntity.ok(
                Map.of(
                        "success", true,
                        "message", "조회 성공",
                        "data", list,
                        "totalElements", jobPosts.getTotalElements(),
                        "totalPages", jobPosts.getTotalPages(),
                        "currentPage", page
                )
        );
    }

    // ===============================
    // 📝 공고 생성
    // ===============================
    @PostMapping
    public ResponseEntity<?> createJobPost(@RequestBody Map<String, Object> req) {

        JobPosts job = new JobPosts();
        job.setTitle((String) req.get("title"));
        job.setContent((String) req.get("content"));
        job.setEndAt(req.get("endAt") != null ? java.time.LocalDate.parse(req.get("endAt").toString()) : null);
        job.setLocation((String) req.get("location"));
        job.setCareerLevel((String) req.get("careerLevel"));
        job.setEducation((String) req.get("education"));
        job.setPosition((String) req.get("position"));
        job.setType((String) req.get("type"));
        job.setMainJob((String) req.get("mainJob"));
        job.setQualification((String) req.get("qualification"));
        job.setPreference((String) req.get("preference"));
        job.setHireType((String) req.get("hireType"));
        job.setViews(0L);

        if (req.get("company") != null) {
            Map<String, Object> cp = (Map<String, Object>) req.get("company");
            var c = new com.we.hirehub.entity.Company();
            c.setId(Long.parseLong(cp.get("id").toString()));
            job.setCompany(c);
        }

        JobPostsDto created = jobPostsService.createJobPost(job);

        List<String> techList = (List<String>) req.get("techStackList");
        JobPosts tmp = new JobPosts();
        tmp.setId(created.getId());
        jobPostsService.saveTechStacks(techList, tmp);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(Map.of("success", true, "message", "등록 성공", "data", created));
    }

    // ===============================
    // ✏️ 공고 수정
    // ===============================
    @PutMapping("/{id}")
    public ResponseEntity<?> updateJobPost(
            @PathVariable Long id,
            @RequestBody Map<String, Object> req
    ) {
        JobPostsDto dto = objectMapper.convertValue(req, JobPostsDto.class);
        JobPostsDto updated = jobPostsService.updateJobPost(id, dto);

        return ResponseEntity.ok(
                Map.of("success", true, "message", "공고 수정 성공", "data", updated)
        );
    }

    // ===============================
    // 📸 공고 이미지 업로드
    // 프론트(adminApi.ts) 경로 그대로 유지!!
    // POST /api/admin/job-management/jobpost-image
    // ===============================
    @PostMapping("/jobpost-image")
    public ResponseEntity<?> uploadJobPostImage(
            @RequestParam("file") MultipartFile file,
            @RequestParam("jobPostId") Long jobPostId
    ) {
        log.info("📸 공고 이미지 업로드 요청 - jobPostId={}", jobPostId);

        try {
            if (file.isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(Map.of("success", false, "message", "파일이 비어 있습니다."));
            }

            // S3 업로드
            String fileUrl = s3Service.uploadJobPostImage(file, jobPostId);

            // DB 저장
            jobPostsService.updateJobPhoto(jobPostId, fileUrl);

            return ResponseEntity.ok(
                    Map.of(
                            "success", true,
                            "message", "이미지 업로드 성공",
                            "fileUrl", fileUrl     // 🔥 프론트 규칙
                    )
            );

        } catch (Exception e) {
            log.error("❌ 공고 이미지 업로드 실패", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("success", false, "message", e.getMessage()));
        }
    }


    // ===============================
    // 🗑 공고 삭제
    // ===============================
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteJobPost(@PathVariable Long id) {
        jobPostsService.deleteJobPost(id);
        return ResponseEntity.ok(Map.of("success", true, "message", "삭제 완료"));
    }
}
