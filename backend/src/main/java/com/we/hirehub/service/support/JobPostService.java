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

@Slf4j
@Service
@RequiredArgsConstructor
public class JobPostService {

    private final RestTemplate restTemplate = new RestTemplate();
    private final JobPostsRepository jobPostRepository;
    private final CompanyRepository companyRepository;
    private final JobPostRecommendationService jobPostRecommendationService;


    /**
     * ⭐ 공고 전체 조회
     * lat/lng 은 DTO 내부에서 자동 추가됨 (toDto)
     */
    public List<JobPostsDto> getAllJobPosts() {
        return jobPostRepository.findAll()
                .stream()
                .map(JobPostsDto::toDto)   // ⭐ lat/lng 포함된 DTO 반환
                .collect(Collectors.toList());
    }

    /**
     * ⭐ 특정 공고 상세 조회
     * DTO 변환 시 lat/lng 자동 포함
     */
    public JobPostsDto getJobPostById(Long id) {
        log.info("🔍 getJobPostById 호출 - ID: {}", id);

        JobPosts job = jobPostRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("해당 공고를 찾을 수 없습니다."));

        log.info("🖼️ DB에서 조회한 photo: {}", job.getPhoto());

        JobPostsDto dto = JobPostsDto.toDto(job);  // ⭐ lat/lng 포함 반환

        log.info("📤 최종 반환 DTO photo: {}", dto.getPhoto());
        return dto;
    }

    /**
     * ⭐ 검색 기능
     * lat/lng 자동 포함됨
     */
    public List<JobPostsDto> searchJobPosts(String keyword) {
        return jobPostRepository.findByTitleContaining(keyword)
                .stream()
                .map(JobPostsDto::toDto)   // ⭐ lat/lng 포함
                .collect(Collectors.toList());
    }

    /**
     * ⚠️ 기존 기능 유지 (Admin에서 등록함)
     * 여기서는 DTO → Entity 변환만 수행
     */
    public JobPostsDto createJobPost(JobPostsDto dto) {
        Company company = companyRepository.findById(dto.getCompanyId())
                .orElseThrow(() -> new RuntimeException("해당 회사가 존재하지 않습니다."));

        JobPosts job = JobPostsDto.toEntity(dto, company);
        JobPosts saved = jobPostRepository.save(job);

        return JobPostsDto.toDto(saved);  // ⭐ lat/lng 포함
    }

    /**
     * 조회수 증가
     */
    public JobPostsDto incrementViews(Long id) {
        JobPosts job = jobPostRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("해당 공고를 찾을 수 없습니다."));

        job.setViews(job.getViews() + 1);
        JobPosts saved = jobPostRepository.save(job);

        return JobPostsDto.toDto(saved);  // ⭐ lat/lng 포함
    }

    /**
     * AI 처리 (기존 유지)
     */
    @Transactional
    public JobPosts saveWithAi(JobPosts post) {

        String full = buildFullText(post);

        Map<String, Object> body = Map.of("content", full);
        var res = restTemplate.postForEntity(
                "http://fastapi:8000/internal/job/prepare",
                body, Map.class);

        Map<String, Object> data = res.getBody();
        post.setSummary((String) data.get("summary"));
        post.setEmbedding(toJson(data.get("embedding")));

        return jobPostRepository.save(post);
    }

    private String buildFullText(JobPosts p) {
        StringBuilder sb = new StringBuilder();
        // 필요시 본문 구성
        return sb.toString();
    }

    private String toJson(Object obj) {
        try {
            return new com.fasterxml.jackson.databind.ObjectMapper().writeValueAsString(obj);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    public List<JobPostsDto> getRecommendedJobs(Long userId) {
        return jobPostRecommendationService.getRecommendedJobs(userId);
    }
}
