package com.we.hirehub.service;

import com.we.hirehub.dto.JobPostsDto;
import com.we.hirehub.entity.Company;
import com.we.hirehub.entity.JobPosts;
import com.we.hirehub.repository.CompanyRepository;
import com.we.hirehub.repository.JobPostsRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Slf4j  // ✅ 로그 추가
@Service
@RequiredArgsConstructor
public class JobPostServiceImpl implements JobPostsService {

    private final JobPostsRepository jobPostRepository;
    private final CompanyRepository companyRepository;

    /** ✅ photo URL을 그대로 전달하는 DTO 변환 메서드 */
    private JobPostsDto convertToDto(JobPosts job) {
        log.info("🎨 convertToDto 시작");
        log.info("📦 Entity photo: {}", job.getPhoto());

        JobPostsDto dto = JobPostsDto.builder()
                .id(job.getId())
                .title(job.getTitle())
                .content(job.getContent())
                .startAt(job.getStartAt())
                .endAt(job.getEndAt())
                .location(job.getLocation())
                .careerLevel(job.getCareerLevel())
                .education(job.getEducation())
                .position(job.getPosition())
                .type(job.getType())
                .salary(job.getSalary())
                .photo(job.getPhoto())  // ✅ S3에서 반환한 완전한 URL 그대로 전달
                .companyName(job.getCompany().getName())
                .companyId(job.getCompany().getId())
                .companyPhoto(job.getCompany().getPhoto())
                .views(job.getViews())
                .build();

        log.info("✅ DTO photo: {}", dto.getPhoto());
        return dto;
    }

    @Override
    public List<JobPostsDto> getAllJobPosts() {
        return jobPostRepository.findAll()
                .stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    @Override
    public JobPostsDto getJobPostById(Long id) {
        log.info("🔍 getJobPostById 호출 - ID: {}", id);

        JobPosts job = jobPostRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("해당 공고를 찾을 수 없습니다."));

        log.info("🖼️ DB에서 조회한 photo: {}", job.getPhoto());

        JobPostsDto dto = convertToDto(job);

        log.info("📤 최종 반환 DTO photo: {}", dto.getPhoto());

        return dto;
    }

    @Override
    public List<JobPostsDto> searchJobPosts(String keyword) {
        return jobPostRepository.findByTitleContaining(keyword)
                .stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    @Override
    public JobPostsDto createJobPost(JobPostsDto dto) {
        Company company = companyRepository.findById(dto.getCompanyId())
                .orElseThrow(() -> new RuntimeException("해당 회사가 존재하지 않습니다."));

        JobPosts job = JobPosts.builder()
                .title(dto.getTitle())
                .content(dto.getContent())
                .startAt(dto.getStartAt())
                .endAt(dto.getEndAt())
                .location(dto.getLocation())
                .careerLevel(dto.getCareerLevel())
                .education(dto.getEducation())
                .position(dto.getPosition())
                .type(dto.getType())
                .salary(dto.getSalary())
                .photo(dto.getPhoto())
                .company(company)
                .build();

        JobPosts saved = jobPostRepository.save(job);
        return convertToDto(saved);
    }

    @Override
    public JobPostsDto incrementViews(Long id) {
        JobPosts job = jobPostRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("해당 공고를 찾을 수 없습니다."));

        job.setViews(job.getViews() + 1);
        JobPosts saved = jobPostRepository.save(job);

        return convertToDto(saved);
    }
}