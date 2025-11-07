package com.we.hirehub.service.admin;

import com.we.hirehub.dto.JobPostsDto;
import com.we.hirehub.entity.JobPosts;
import com.we.hirehub.repository.JobPostsRepository; // ✅ [수정] JobPostRepository → JobPostsRepository 로 변경
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class JobPostsAdminService {

    // ✅ [수정] 타입명 통일 (JobPostRepository → JobPostsRepository)
    private final JobPostsRepository jobPostsRepository;

    // ✅ [추가] 전체 조회 + 검색 통합 버전
    public Page<JobPostsDto> getAllJobPosts(Pageable pageable, String keyword) {
        Page<JobPosts> jobPosts;

        if (keyword == null || keyword.isBlank()) {
            log.info("📄 전체 공고 조회");
            jobPosts = jobPostsRepository.findAll(pageable);
        } else {
            log.info("🔍 검색어 '{}' 로 공고 검색", keyword);
            jobPosts = jobPostsRepository.findByTitleContainingIgnoreCaseOrCompany_NameContainingIgnoreCaseOrPositionContainingIgnoreCase(
                    keyword, keyword, keyword, pageable
            );
        }

        // ✅ [수정] Page<JobPosts> → Page<JobPostsDto> 변환
        return jobPosts.map(this::convertToDto);
    }

    // ✅ [추가] 기존 page, size 기반 메서드 (Controller에서 page 파라미터 받는 경우)
    public Page<JobPostsDto> getAllJobPosts(int page, int size, String sortBy, String direction, String keyword) {
        Pageable pageable = PageRequest.of(
                page, size,
                direction.equalsIgnoreCase("DESC") ? Sort.Direction.DESC : Sort.Direction.ASC,
                sortBy
        );

        return getAllJobPosts(pageable, keyword);
    }

    // ✅ 공고 단일 조회
    public JobPostsDto getJobPostById(Long jobPostId) {
        JobPosts jobPost = jobPostsRepository.findById(jobPostId)
                .orElseThrow(() -> new IllegalArgumentException("공고를 찾을 수 없습니다: " + jobPostId));
        return convertToDto(jobPost);
    }

    // ✅ 공고 등록
    @Transactional
    public JobPostsDto createJobPost(JobPosts jobPost) {
        // 1️⃣ 먼저 공고 저장 (photo는 아직 없음)
        JobPosts saved = jobPostsRepository.save(jobPost);

        // 2️⃣ 로그 확인
        log.info("✅ 신규 공고 저장 완료 - id: {}, title: {}", saved.getId(), saved.getTitle());

        // 3️⃣ 다른 공고 photo 절대 건드리지 않음 (중요)
        //    기존 코드에서 jobPostsRepository.findAll() or updateAll() 같은 루프 절대 넣지 말기!

        return convertToDto(saved);
    }

    // ✅ 공고 수정
    @Transactional
    public JobPostsDto updateJobPost(Long jobPostId, JobPosts updateData) {
        JobPosts jobPost = jobPostsRepository.findById(jobPostId)
                .orElseThrow(() -> new IllegalArgumentException("공고를 찾을 수 없습니다: " + jobPostId));

        if (updateData.getTitle() != null && !updateData.getTitle().isBlank())
            jobPost.setTitle(updateData.getTitle());
        if (updateData.getContent() != null && !updateData.getContent().isBlank())
            jobPost.setContent(updateData.getContent());
        if (updateData.getLocation() != null && !updateData.getLocation().isBlank())
            jobPost.setLocation(updateData.getLocation());
        if (updateData.getCareerLevel() != null && !updateData.getCareerLevel().isBlank())
            jobPost.setCareerLevel(updateData.getCareerLevel());
        if (updateData.getEducation() != null && !updateData.getEducation().isBlank())
            jobPost.setEducation(updateData.getEducation());
        if (updateData.getPosition() != null && !updateData.getPosition().isBlank())
            jobPost.setPosition(updateData.getPosition());
        if (updateData.getType() != null && !updateData.getType().isBlank())
            jobPost.setType(updateData.getType());
        if (updateData.getSalary() != null && !updateData.getSalary().isBlank())
            jobPost.setSalary(updateData.getSalary());
        if (updateData.getStartAt() != null)
            jobPost.setStartAt(updateData.getStartAt());
        if (updateData.getEndAt() != null)
            jobPost.setEndAt(updateData.getEndAt());

        validateJobPostDates(jobPost.getStartAt(), jobPost.getEndAt());
        JobPosts updated = jobPostsRepository.save(jobPost);
        return convertToDto(updated);
    }

    // ✅ 공고 삭제
    @Transactional
    public void deleteJobPost(Long jobPostId) {
        if (!jobPostsRepository.existsById(jobPostId)) {
            throw new IllegalArgumentException("존재하지 않는 공고입니다: " + jobPostId);
        }
        jobPostsRepository.deleteById(jobPostId);
    }

    // ✅ 이미지 삭제 또는 수정 시 photo 업데이트
    @Transactional
    public void updateJobPhoto(Long jobPostId, String fileUrl) {
        JobPosts jobPost = jobPostsRepository.findById(jobPostId)
                .orElseThrow(() -> new IllegalArgumentException("공고를 찾을 수 없습니다: " + jobPostId));
        jobPost.setPhoto(fileUrl);
        jobPostsRepository.save(jobPost);
    }

    // ✅ 내부 유효성 검증
    private void validateJobPost(JobPosts jobPost) {
        if (jobPost.getTitle() == null || jobPost.getTitle().trim().isEmpty())
            throw new IllegalArgumentException("공고 제목이 필요합니다");
        if (jobPost.getContent() == null || jobPost.getContent().trim().isEmpty())
            throw new IllegalArgumentException("공고 내용이 필요합니다");
        if (jobPost.getStartAt() == null)
            throw new IllegalArgumentException("시작일이 필요합니다");
        if (jobPost.getEndAt() == null)
            throw new IllegalArgumentException("마감일이 필요합니다");

        validateJobPostDates(jobPost.getStartAt(), jobPost.getEndAt());
    }

    private void validateJobPostDates(LocalDate startAt, LocalDate endAt) {
        if (startAt.isAfter(endAt)) {
            throw new IllegalArgumentException("시작일이 마감일보다 늦을 수 없습니다");
        }
        LocalDate today = LocalDate.now();
        if (endAt.isBefore(today)) {
            throw new IllegalArgumentException("마감일은 오늘 이후여야 합니다");
        }
    }

    // ✅ DTO 변환
    private JobPostsDto convertToDto(JobPosts jobPost) {
        JobPostsDto.CompanyDto companyDto = null;
        if (jobPost.getCompany() != null) {
            companyDto = JobPostsDto.CompanyDto.builder()
                    .id(jobPost.getCompany().getId())
                    .name(jobPost.getCompany().getName())
                    .build();
        }

        return JobPostsDto.builder()
                .id(jobPost.getId())
                .title(jobPost.getTitle())
                .content(jobPost.getContent())
                .startAt(jobPost.getStartAt())
                .endAt(jobPost.getEndAt())
                .location(jobPost.getLocation())
                .careerLevel(jobPost.getCareerLevel())
                .education(jobPost.getEducation())
                .position(jobPost.getPosition())
                .type(jobPost.getType())
                .salary(jobPost.getSalary())
                .photo(jobPost.getPhoto())
                .company(companyDto)
                .companyName(jobPost.getCompany() != null ? jobPost.getCompany().getName() : null)
                .build();
    }
}
