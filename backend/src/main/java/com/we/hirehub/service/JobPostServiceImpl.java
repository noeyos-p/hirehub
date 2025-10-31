package com.we.hirehub.service;

import com.we.hirehub.dto.JobPostsDto;
import com.we.hirehub.entity.Company;
import com.we.hirehub.entity.JobPosts;
import com.we.hirehub.repository.CompanyRepository;
import com.we.hirehub.repository.JobPostsRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class JobPostServiceImpl implements JobPostsService {
    private final JobPostsRepository jobPostRepository;
    private final CompanyRepository companyRepository; // @Repository 인터페이스

    // JobPostServiceImpl.java의 convertToDto 메서드 수정
    private JobPostsDto convertToDto(JobPosts job) {
        return JobPostsDto.builder()
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
                .companyName(job.getCompany().getName())
                .companyId(job.getCompany().getId())  // ⭐ 추가
                .views(job.getViews())
                .build();
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
        return jobPostRepository.findById(id)
                .map(this::convertToDto)
                .orElseThrow(() -> new RuntimeException("해당 공고를 찾을 수 없습니다."));
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
        // 1️⃣ 회사 조회 (리스트로 받아 첫 번째만 사용)
        List<Company> companies = companyRepository.findByName(dto.getCompanyName());

        if (companies.isEmpty()) {
            throw new RuntimeException("해당 회사가 존재하지 않습니다.");
        }

        Company company = companies.get(0); // 첫 번째 회사 선택

        // 2️⃣ 엔티티 변환
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
                .company(company) // Company 객체 연결
                .build();

        // 3️⃣ DB 저장
        JobPosts saved = jobPostRepository.save(job);

        return convertToDto(saved);
    }

    @Override
    public JobPostsDto incrementViews(Long id) {
        JobPosts job = jobPostRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("해당 공고를 찾을 수 없습니다."));

        job.setViews(job.getViews() + 1); // 조회수 증가
        JobPosts saved = jobPostRepository.save(job);

        return convertToDto(saved);
    }


}
