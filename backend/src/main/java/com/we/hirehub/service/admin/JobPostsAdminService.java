package com.we.hirehub.service.admin;

import com.we.hirehub.dto.support.JobPostsDto;
import com.we.hirehub.entity.JobPosts;
import com.we.hirehub.entity.TechStack;
import com.we.hirehub.repository.JobPostsRepository;
import com.we.hirehub.repository.TechStackRepository;
import com.we.hirehub.service.support.JobPostAiService;
import com.we.hirehub.service.support.KakaoMapService;     // ⭐ 추가됨
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class JobPostsAdminService {

    private final JobPostsRepository jobPostsRepository;
    private final TechStackRepository techStackRepository;
    private final JobPostAiService jobPostAiService;

    // ⭐ 추가된 부분: 카카오 지도 서비스 의존성
    private final KakaoMapService kakaoMapService;

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

        return jobPosts.map(JobPostsDto::toDto);
    }

    public Page<JobPostsDto> getAllJobPosts(int page, int size, String sortBy, String direction, String keyword) {
        Pageable pageable = PageRequest.of(
                page, size,
                direction.equalsIgnoreCase("DESC") ? Sort.Direction.DESC : Sort.Direction.ASC,
                sortBy
        );

        return getAllJobPosts(pageable, keyword);
    }

    public JobPostsDto getJobPostById(Long jobPostId) {
        JobPosts jobPost = jobPostsRepository.findById(jobPostId)
                .orElseThrow(() -> new IllegalArgumentException("공고를 찾을 수 없습니다: " + jobPostId));
        return JobPostsDto.toDto(jobPost);
    }

    /**
     * ✅ 공고 등록 + AI 자동 처리
     * ⭐ 기존 기능 유지
     */
    @Transactional
    public JobPostsDto createJobPost(JobPosts jobPost) {
        log.info("📝 신규 공고 등록 시작 - 제목: {}", jobPost.getTitle());

        // ⭐ 추가된 부분: location 기반 좌표 자동 저장
        if (jobPost.getLocation() != null) {
            var latLng = kakaoMapService.getLatLngFromAddress(jobPost.getLocation());
            if (latLng != null) {
                jobPost.setLat(latLng.getLat());
                jobPost.setLng(latLng.getLng());
                log.info("📍 [신규] 좌표 저장 lat={}, lng={}", latLng.getLat(), latLng.getLng());
            }
        }

        JobPosts saved = jobPostsRepository.save(jobPost);
        log.info("✅ 공고 저장 완료 - ID: {}", saved.getId());

        processAI(saved, "등록");

        return JobPostsDto.toDto(saved);
    }

    /**
     * ✅ 공고 수정 + AI 재처리
     * ⭐ 기존 기능 유지
     */
    @Transactional
    public JobPostsDto updateJobPost(Long jobPostId, JobPostsDto dto) {
        log.info("📝 공고 수정 시작 - ID: {}", jobPostId);

        JobPosts jobPost = jobPostsRepository.findById(jobPostId)
                .orElseThrow(() -> new IllegalArgumentException("공고를 찾을 수 없습니다: " + jobPostId));

        String oldLocation = jobPost.getLocation();  // ⭐ 기존 location 보관

        JobPostsDto.updateEntity(dto, jobPost);

        // ⭐ 추가된 부분: 위치 변경 시 자동 geocoding
        if (dto.getLocation() != null && !dto.getLocation().equals(oldLocation)) {
            var latLng = kakaoMapService.getLatLngFromAddress(jobPost.getLocation());
            if (latLng != null) {
                jobPost.setLat(latLng.getLat());
                jobPost.setLng(latLng.getLng());
                log.info("📍 [신규] 위치 변경 감지 → 위경도 갱신 완료");
            }
        }

        if (jobPost.getEndAt() != null) validateJobPostDates(jobPost.getEndAt());

        JobPosts updated = jobPostsRepository.save(jobPost);
        log.info("✅ 공고 수정 완료 - ID: {}", updated.getId());

        updated.setSummary(null);
        updated.setEmbedding(null);
        processAI(updated, "수정");

        return JobPostsDto.toDto(updated);
    }

    /**
     * 🤖 AI 처리 공통 로직
     */
    private void processAI(JobPosts jobPost, String action) {
        try {
            log.info("🤖 AI 처리 시작 - {} - ID: {}", action, jobPost.getId());

            JobPosts processed = jobPostAiService.generateSummaryAndEmbedding(jobPost);
            jobPostsRepository.save(processed);

            log.info("🎉 AI 처리 완료 - {} - Summary: {}자, Embedding: {}",
                    action,
                    processed.getSummary() != null ? processed.getSummary().length() : 0,
                    processed.getEmbedding() != null ? "생성됨" : "없음");

        } catch (Exception e) {
            log.error("⚠️ AI 처리 실패 (공고는 저장됨) - {} - ID: {}", action, jobPost.getId(), e);
        }
    }

    @Transactional
    public void deleteJobPost(Long jobPostId) {
        if (!jobPostsRepository.existsById(jobPostId)) {
            throw new IllegalArgumentException("존재하지 않는 공고입니다: " + jobPostId);
        }
        techStackRepository.deleteByJobPostId(jobPostId);
        jobPostsRepository.deleteById(jobPostId);
    }

    public List<TechStack> getTechStacksByJobPostId(Long jobPostId) {
        return techStackRepository.findByJobPostId(jobPostId);
    }

    @Transactional
    public void saveTechStacks(List<String> techStackList, JobPosts jobPost) {
        if (techStackList != null && !techStackList.isEmpty()) {
            for (String techName : techStackList) {
                TechStack techStack = TechStack.builder()
                        .name(techName)
                        .jobPost(jobPost)
                        .build();
                techStackRepository.save(techStack);
            }
        }
    }

    @Transactional
    public void updateTechStacks(Long jobPostId, List<String> techStackList, JobPosts jobPost) {
        techStackRepository.deleteByJobPostId(jobPostId);
        saveTechStacks(techStackList, jobPost);
    }

    @Transactional
    public void updateJobPhoto(Long jobPostId, String fileUrl) {
        JobPosts jobPost = jobPostsRepository.findById(jobPostId)
                .orElseThrow(() -> new IllegalArgumentException("공고를 찾을 수 없습니다: " + jobPostId));
        jobPost.setPhoto(fileUrl);
        jobPostsRepository.save(jobPost);
    }

    private void validateJobPost(JobPosts jobPost) {
        if (jobPost.getTitle() == null || jobPost.getTitle().trim().isEmpty())
            throw new IllegalArgumentException("공고 제목이 필요합니다");
        if (jobPost.getContent() == null || jobPost.getContent().trim().isEmpty())
            throw new IllegalArgumentException("공고 내용이 필요합니다");

        if (jobPost.getEndAt() != null) validateJobPostDates(jobPost.getEndAt());
    }

    private void validateJobPostDates(LocalDate endAt) {
        if (endAt == null) return;

        LocalDate today = LocalDate.now();
        if (endAt.isBefore(today)) {
            throw new IllegalArgumentException("마감일은 오늘 이후여야 합니다");
        }
    }
}
