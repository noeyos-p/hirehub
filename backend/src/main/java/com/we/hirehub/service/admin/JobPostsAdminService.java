package com.we.hirehub.service.admin;

import com.we.hirehub.dto.support.JobPostsDto;
import com.we.hirehub.entity.JobPosts;
import com.we.hirehub.entity.TechStack;
import com.we.hirehub.repository.JobPostsRepository;
import com.we.hirehub.repository.MatchingRepository;
import com.we.hirehub.repository.TechStackRepository;
import com.we.hirehub.service.support.JobPostAiService;
import com.we.hirehub.service.support.KakaoMapService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.*;
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
    private final KakaoMapService kakaoMapService;
    private final com.we.hirehub.repository.ApplyRepository applyRepository;
    private final com.we.hirehub.repository.ScrapPostsRepository scrapPostsRepository;
    private final MatchingRepository matchingRepository;

    /** 조회 */
    public Page<JobPostsDto> getAllJobPosts(Pageable pageable, String keyword) {
        Page<JobPosts> posts;

        if (keyword == null || keyword.isBlank()) {
            posts = jobPostsRepository.findAll(pageable);
        } else {
            posts = jobPostsRepository.findByTitleContainingIgnoreCaseOrCompany_NameContainingIgnoreCaseOrPositionContainingIgnoreCase(
                    keyword, keyword, keyword, pageable
            );
        }

        return posts.map(JobPostsDto::toDto);
    }

    /** 단건 조회 */
    public JobPostsDto getJobPostById(Long id) {
        return JobPostsDto.toDto(
                jobPostsRepository.findById(id)
                        .orElseThrow(() -> new IllegalArgumentException("공고 없음: " + id))
        );
    }

    /** 생성 */
    @Transactional
    public JobPostsDto createJobPost(JobPosts jobPost) {

        if (jobPost.getLocation() != null) {
            var pos = kakaoMapService.getLatLngFromAddress(jobPost.getLocation());
            if (pos != null) {
                jobPost.setLat(pos.getLat());
                jobPost.setLng(pos.getLng());
            }
        }

        JobPosts saved = jobPostsRepository.save(jobPost);

        // AI 처리
        processAI(saved, "등록");

        return JobPostsDto.toDto(saved);
    }

    /** 수정 */
    @Transactional
    public JobPostsDto updateJobPost(Long id, JobPostsDto dto) {

        JobPosts job = jobPostsRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("공고 없음: " + id));

        // dto → entity 매핑
        JobPostsDto.updateEntity(dto, job);

        // ============================
        // ⭐ 무조건 주소 기반 위경도 다시 계산
        // ============================
        if (dto.getLocation() != null) {
            try {
                var pos = kakaoMapService.getLatLngFromAddress(dto.getLocation());
                if (pos != null) {
                    job.setLat(pos.getLat());
                    job.setLng(pos.getLng());
                }
            } catch (Exception e) {
                log.error("위경도 계산 실패", e);
            }
        }

        if (job.getEndAt() != null)
            validateJobPostDates(job.getEndAt());

        JobPosts updated = jobPostsRepository.save(job);

        updated.setSummary(null);
        updated.setEmbedding(null);

        processAI(updated, "수정");

        return JobPostsDto.toDto(updated);
    }

    /** 삭제 */
    @Transactional
    public void deleteJobPost(Long id) {
        // FK 제약조건으로 인한 순서: 지원내역/스크랩 -> 기술스택 -> 공고
        applyRepository.deleteByJobPosts_Id(id);
        scrapPostsRepository.deleteByJobPosts_Id(id);
        matchingRepository.deleteByJobPosts_Id(id);
        techStackRepository.deleteByJobPostId(id);
        jobPostsRepository.deleteById(id);
    }

    public List<TechStack> getTechStacksByJobPostId(Long id) {
        return techStackRepository.findByJobPostId(id);
    }

    @Transactional
    public void saveTechStacks(List<String> list, JobPosts job) {
        if (list == null) return;

        for (String name : list) {
            TechStack t = TechStack.builder()
                    .name(name)
                    .jobPost(job)
                    .build();
            techStackRepository.save(t);
        }
    }

    @Transactional
    public void updateTechStacks(Long id, List<String> list, JobPosts job) {
        techStackRepository.deleteByJobPostId(id);
        saveTechStacks(list, job);
    }

    @Transactional
    public void updateJobPhoto(Long id, String url) {
        JobPosts post = jobPostsRepository.findById(id)
                .orElseThrow();
        post.setPhoto(url);
        jobPostsRepository.save(post);
    }

    private void processAI(JobPosts jobPost, String action) {
        try {
            JobPosts processed = jobPostAiService.generateSummaryAndEmbedding(jobPost);
            jobPostsRepository.save(processed);
        } catch (Exception e) {
            log.error("AI 처리 실패 ({})", action, e);
        }
    }

    private void validateJobPostDates(LocalDate endAt) {
        if (endAt.isBefore(LocalDate.now())) {
            throw new IllegalArgumentException("마감일 오류");
        }
    }
}
