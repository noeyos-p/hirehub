package com.we.hirehub.service.admin;

import com.we.hirehub.dto.JobPostsDto;
import com.we.hirehub.entity.JobPosts;
import com.we.hirehub.repository.JobPostsRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class JobPostsAdminService {

    private final JobPostsRepository jobPostsRepository;

    // ============ 조회 ============

    public Page<JobPostsDto> getAllJobPosts(Pageable pageable) {
        log.debug("모든 공고 조회");
        Page<JobPosts> jobPosts = jobPostsRepository.findAll(pageable);
        return jobPosts.map(this::convertToDto);
    }

    public JobPostsDto getJobPostById(Long jobPostId) {
        log.debug("공고 조회: {}", jobPostId);
        JobPosts jobPost = jobPostsRepository.findById(jobPostId)
                .orElseThrow(() -> new IllegalArgumentException("공고를 찾을 수 없습니다: " + jobPostId));
        return convertToDto(jobPost);
    }


    // ============ 생성 ============

    @Transactional
    public JobPostsDto createJobPost(JobPosts jobPost) {
        log.info("공고 생성: {}", jobPost.getTitle());
        log.info("✅ save() 호출 전 - Company ID: {}", jobPost.getCompany() != null ? jobPost.getCompany().getId() : "NULL");

        validateJobPost(jobPost);  // 생성 전 검증

        JobPosts savedJobPost = jobPostsRepository.save(jobPost);

        log.info("✅ save() 호출 후 - 생성된 ID: {}", savedJobPost.getId());
        log.info("✅ save() 호출 후 - Company: {}", savedJobPost.getCompany());

        // ✅ 강제 flush & 확인
        jobPostsRepository.flush();
        log.info("✅ flush() 완료");

        // ✅ DB에 실제로 있는지 즉시 확인
        boolean exists = jobPostsRepository.existsById(savedJobPost.getId());
        log.info("✅ DB 존재 확인: {}", exists);

        return convertToDto(savedJobPost);
    }

    // ============ 수정 ============

    @Transactional
    public JobPostsDto updateJobPost(Long jobPostId, JobPosts updateData) {
        log.info("공고 수정: {}", jobPostId);
        JobPosts jobPost = jobPostsRepository.findById(jobPostId)
                .orElseThrow(() -> new IllegalArgumentException("공고를 찾을 수 없습니다: " + jobPostId));

        // 임시 객체에 먼저 설정해서 검증
        LocalDate newStartAt = jobPost.getStartAt();
        LocalDate newEndAt = jobPost.getEndAt();

        // 제목 업데이트 (빈 문자열 체크)
        if (updateData.getTitle() != null && !updateData.getTitle().trim().isEmpty()) {
            jobPost.setTitle(updateData.getTitle());
        }

        // 내용 업데이트 (빈 문자열 체크)
        if (updateData.getContent() != null && !updateData.getContent().trim().isEmpty()) {
            jobPost.setContent(updateData.getContent());
        }

        // 시작일 업데이트
        if (updateData.getStartAt() != null) {
            newStartAt = updateData.getStartAt();
            jobPost.setStartAt(newStartAt);
        }

        // 마감일 업데이트
        if (updateData.getEndAt() != null) {
            newEndAt = updateData.getEndAt();
            jobPost.setEndAt(newEndAt);
        }

        // 위치 업데이트 (빈 문자열 체크)
        if (updateData.getLocation() != null && !updateData.getLocation().trim().isEmpty()) {
            jobPost.setLocation(updateData.getLocation());
        }

        // 경력 업데이트 (빈 문자열 체크)
        if (updateData.getCareerLevel() != null && !updateData.getCareerLevel().trim().isEmpty()) {
            jobPost.setCareerLevel(updateData.getCareerLevel());
        }

        // 학력 업데이트 (빈 문자열 체크)
        if (updateData.getEducation() != null && !updateData.getEducation().trim().isEmpty()) {
            jobPost.setEducation(updateData.getEducation());
        }

        // 직무 업데이트 (빈 문자열 체크)
        if (updateData.getPosition() != null && !updateData.getPosition().trim().isEmpty()) {
            jobPost.setPosition(updateData.getPosition());
        }

        // 고용형태 업데이트 (빈 문자열 체크)
        if (updateData.getType() != null && !updateData.getType().trim().isEmpty()) {
            jobPost.setType(updateData.getType());
        }

        // 급여 업데이트 (빈 문자열 체크)
        if (updateData.getSalary() != null && !updateData.getSalary().trim().isEmpty()) {
            jobPost.setSalary(updateData.getSalary());
        }

        // ✅ 모든 업데이트 후 한 번에 검증
        validateJobPostDates(newStartAt, newEndAt);

        JobPosts updatedJobPost = jobPostsRepository.save(jobPost);
        return convertToDto(updatedJobPost);
    }

    // ============ 삭제 ============

    @Transactional
    public void deleteJobPost(Long jobPostId) {
        log.info("공고 삭제: {}", jobPostId);
        if (!jobPostsRepository.existsById(jobPostId)) {
            throw new IllegalArgumentException("존재하지 않는 공고입니다");
        }
        jobPostsRepository.deleteById(jobPostId);
    }

    // ============ DTO 변환 ============

    private JobPostsDto convertToDto(JobPosts jobPost) {
        // ✅ Company DTO 변환
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
                .position(jobPost.getPosition())  // ✅ 추가
                .type(jobPost.getType())
                .photo(jobPost.getPhoto())
                .salary(jobPost.getSalary())
                .companyName(jobPost.getCompany() != null ? jobPost.getCompany().getName() : null)
                .company(companyDto)  // ✅ 추가!
                .build();
    }

    // ============ 유효성 검사 ============

    // ✅ 공고 전체 검증 (생성용)
    private void validateJobPost(JobPosts jobPost) {
        if (jobPost.getTitle() == null || jobPost.getTitle().trim().isEmpty()) {
            throw new IllegalArgumentException("공고 제목이 필요합니다");
        }
        if (jobPost.getContent() == null || jobPost.getContent().trim().isEmpty()) {
            throw new IllegalArgumentException("공고 내용이 필요합니다");
        }
        if (jobPost.getStartAt() == null) {
            throw new IllegalArgumentException("시작일이 필요합니다");
        }
        if (jobPost.getEndAt() == null) {
            throw new IllegalArgumentException("마감일이 필요합니다");
        }

        validateJobPostDates(jobPost.getStartAt(), jobPost.getEndAt());
    }

    // ✅ 날짜 검증 (수정용 - 파라미터로 받음)
    private void validateJobPostDates(LocalDate startAt, LocalDate endAt) {
        if (startAt.isAfter(endAt)) {
            throw new IllegalArgumentException("시작일이 마감일보다 뒤에 있습니다");
        }

        LocalDate today = LocalDate.now();
        if (endAt.isBefore(today)) {
            log.warn("마감일이 오늘 이전입니다: {}", endAt);
            throw new IllegalArgumentException("마감일은 오늘 이후여야 합니다");
        }
    }
    @Transactional
    public void updateJobPhoto(Long jobPostId, String fileUrl) {
        JobPosts jobPost = jobPostsRepository.findById(jobPostId)
                .orElseThrow(() -> new IllegalArgumentException("해당 공고를 찾을 수 없습니다. ID: " + jobPostId));

        jobPost.setPhoto(fileUrl);  // null이면 삭제 처리
        jobPostsRepository.save(jobPost);
    }
}