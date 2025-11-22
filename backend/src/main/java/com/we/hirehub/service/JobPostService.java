package com.we.hirehub.service;

import com.we.hirehub.dto.job.JobPostsDto;
import com.we.hirehub.entity.Company;
import com.we.hirehub.entity.JobPosts;
import com.we.hirehub.repository.CompanyRepository;
import com.we.hirehub.repository.JobPostsRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j  // ✅ 로그 추가
@Service
@RequiredArgsConstructor
public class JobPostService {

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
}