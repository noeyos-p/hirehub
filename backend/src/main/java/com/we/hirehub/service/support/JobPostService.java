package com.we.hirehub.service.support;

import com.we.hirehub.dto.support.JobPostsDto;
import com.we.hirehub.entity.Company;
import com.we.hirehub.entity.JobPosts;
import com.we.hirehub.repository.CompanyRepository;
import com.we.hirehub.repository.JobPostsRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j  // ✅ 로그 추가
@Service
@RequiredArgsConstructor
public class JobPostService {

    private final RestTemplate restTemplate = new RestTemplate();
    private final JobPostsRepository jobPostRepository;
    private final CompanyRepository companyRepository;

    public List<JobPostsDto> getAllJobPosts() {
        return jobPostRepository.findAll()
                .stream()
                .map(JobPostsDto::toDto)
                .collect(Collectors.toList());
    }

    public JobPostsDto getJobPostById(Long id) {
        log.info("🔍 getJobPostById 호출 - ID: {}", id);

        JobPosts job = jobPostRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("해당 공고를 찾을 수 없습니다."));

        log.info("🖼️ DB에서 조회한 photo: {}", job.getPhoto());

        JobPostsDto dto = JobPostsDto.toDto(job);

        log.info("📤 최종 반환 DTO photo: {}", dto.getPhoto());

        return dto;
    }

    public List<JobPostsDto> searchJobPosts(String keyword) {
        return jobPostRepository.findByTitleContaining(keyword)
                .stream()
                .map(JobPostsDto::toDto)
                .collect(Collectors.toList());
    }

    public JobPostsDto createJobPost(JobPostsDto dto) {
        Company company = companyRepository.findById(dto.getCompanyId())
                .orElseThrow(() -> new RuntimeException("해당 회사가 존재하지 않습니다."));

        JobPosts job = JobPostsDto.toEntity(dto, company);
        JobPosts saved = jobPostRepository.save(job);

        return JobPostsDto.toDto(saved);
    }


    public JobPostsDto incrementViews(Long id) {
        JobPosts job = jobPostRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("해당 공고를 찾을 수 없습니다."));

        job.setViews(job.getViews() + 1);
        JobPosts saved = jobPostRepository.save(job);

        return JobPostsDto.toDto(saved);
    }

    @Transactional
    public JobPosts saveWithAi(JobPosts post) {
        // 공고 본문(제목+내용 등) 합친 텍스트
        String full = buildFullText(post);

        Map<String, Object> body = Map.of("content", full);
        var res = restTemplate.postForEntity(
                "http://fastapi:8000/internal/job/prepare",
                body, Map.class);

        Map<String, Object> data = res.getBody();
        post.setSummary((String) data.get("summary"));
        // embedding -> JSON 문자열 저장
        post.setEmbedding(toJson(data.get("embedding")));

        return jobPostRepository.save(post);
    }

    private String buildFullText(JobPosts p) {
        StringBuilder sb = new StringBuilder();
        // 네가 가진 필드들 적절히 연결
        // ex) sb.append(p.getTitle()).append("\n").append(p.getDescription());
        return sb.toString();
    }

    private String toJson(Object obj) {
        try {
            return new com.fasterxml.jackson.databind.ObjectMapper().writeValueAsString(obj);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }
}