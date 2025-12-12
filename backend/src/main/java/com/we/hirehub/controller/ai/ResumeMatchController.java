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
import com.we.hirehub.service.support.ResumeMatchService;
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

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class ResumeMatchController {

    private final ResumeRepository resumeRepository;
    private final ResumeMatchService resumeMatchService;

    @PostMapping("/match")
    public Map<String, Object> match(@RequestBody Map<String, Long> body) {

        Long resumeId = body.get("resumeId");
        if (resumeId == null) {
            throw new IllegalArgumentException("resumeId is required");
        }

        Resume resume = resumeRepository.findById(resumeId)
                .orElseThrow(() -> new IllegalArgumentException("Resume not found"));

        String fullText = resume.getHtmlContent();
        String summary = resume.getEssayContent();

        var list = resumeMatchService.match(resumeId, fullText, summary);

        List<Map<String, Object>> results = list.stream().map(r -> Map.of(
                "jobId", r.jobId,
                "companyId", r.companyId,
                "jobTitle", r.jobTitle != null ? r.jobTitle : "",
                "companyName", r.companyName != null ? r.companyName : "",
                "score", r.aiScore,
                "grade", convertToGrade(r.aiScore),
                "reasons", List.of(r.reason)
        )).toList();

        return Map.of("results", results);
    }

    private String convertToGrade(double score) {
        if (score >= 90) return "S";
        if (score >= 80) return "A";
        if (score >= 70) return "B";
        if (score >= 60) return "C";
        return "D";
    }
}
