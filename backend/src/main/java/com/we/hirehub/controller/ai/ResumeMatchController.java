package com.we.hirehub.controller.ai;

import com.we.hirehub.dto.aiMapper.CompanyAiMapper;
import com.we.hirehub.dto.aiMapper.JobAiMapper;
import com.we.hirehub.dto.aiMapper.ResumeAiMapper;
import com.we.hirehub.dto.aiMapper.UsersAiMapper;
import com.we.hirehub.entity.Company;
import com.we.hirehub.entity.JobPosts;
import com.we.hirehub.entity.Resume;
import com.we.hirehub.entity.Users;
import com.we.hirehub.repository.CompanyRepository;
import com.we.hirehub.repository.JobPostsRepository;
import com.we.hirehub.repository.ResumeRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestTemplate;

import java.util.*;

@Slf4j
@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class ResumeMatchController {

    @Value("${ai.server-url:http://localhost:8000}")
    private String aiServerUrl;

    private final ResumeRepository resumeRepository;
    private final JobPostsRepository jobPostsRepository;
    private final CompanyRepository companyRepository;

    private final ResumeAiMapper resumeAiMapper;
    private final JobAiMapper jobAiMapper;
    private final CompanyAiMapper companyAiMapper;
    private final UsersAiMapper usersAiMapper;

    private final RestTemplate rest = new RestTemplate();

    @PostMapping("/resume/match")
    public ResponseEntity<?> matchResume(@RequestBody Map<String, Object> payload) {

        Long resumeId = Long.valueOf(payload.get("resumeId").toString());
        log.info("🎯 Resume match requested for ID: {}", resumeId);

        Resume resume = resumeRepository.findById(resumeId)
                .orElseThrow(() -> new RuntimeException("Resume not found"));
        Users user = resume.getUsers();

        // ✅ JobPosts ID 1001~1021만 매칭
        List<JobPosts> jobs = jobPostsRepository.findByIdBetween(1001L, 1021L);
        log.info("🧩 Matching job posts count: {}", jobs.size());

        if (jobs.isEmpty()) {
            return ResponseEntity.ok(Map.of("results", Collections.emptyList()));
        }

        List<Map<String, Object>> results = new ArrayList<>();
        int batchSize = 3;

        for (int i = 0; i < jobs.size(); i += batchSize) {
            List<JobPosts> batch = jobs.subList(i, Math.min(i + batchSize, jobs.size()));

            Map<String, Object> body = Map.of(
                    "user", usersAiMapper.toAiPayload(user),
                    "resume", resumeAiMapper.toAiPayload(resume),
                    "jobs", batch.stream().map(job -> {
                        Map<String, Object> map = new HashMap<>(jobAiMapper.toAiPayload(job));
                        Company company = job.getCompany();
                        if (company != null) {
                            map.put("company", companyAiMapper.toAiPayload(company));
                        }
                        return map;
                    }).toList()
            );

            try {
                log.info("📦 Sending AI batch request ({}~{})", i + 1, Math.min(i + batchSize, jobs.size()));

                Map aiResponse = rest.postForObject(aiServerUrl + "/ai/match-batch", body, Map.class);
                if (aiResponse == null || !aiResponse.containsKey("results")) continue;

                List<Map<String, Object>> batchResults = (List<Map<String, Object>>) aiResponse.get("results");
                results.addAll(batchResults);

            } catch (Exception e) {
                log.error("❌ Batch Matching Error: {}", e.getMessage());
            }

            // 🔹 Rate-limit 보호
            try {
                Thread.sleep(15000);
            } catch (InterruptedException ignored) {}
        }

        results.sort((a, b) -> ((Number) b.get("score")).intValue() - ((Number) a.get("score")).intValue());
        List<Map<String, Object>> topResults = results.stream().limit(10).toList();

        log.info("✅ Matching completed. Returning top 10 results.");
        return ResponseEntity.ok(Map.of("results", topResults));
    }
}
