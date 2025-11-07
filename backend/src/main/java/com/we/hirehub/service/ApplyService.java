package com.we.hirehub.service;

import com.we.hirehub.dto.ApplyResponse;
import com.we.hirehub.entity.Apply;
import com.we.hirehub.entity.JobPosts;
import com.we.hirehub.entity.Resume;
import com.we.hirehub.exception.ResourceNotFoundException;
import com.we.hirehub.repository.ApplyRepository;
import com.we.hirehub.repository.JobPostsRepository;
import com.we.hirehub.repository.ResumeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ApplyService {

    private final ApplyRepository applyRepository;
    private final JobPostsRepository jobPostsRepository;
    private final ResumeRepository resumeRepository;

    /** 공고 지원 (resumeId 없으면 최신 이력서 자동 선택). 중복이면 기존 반환(멱등) */
    @Transactional
    public ApplyResponse apply(Long userId, Long jobPostsId, Long resumeIdOrNull) {
        // 1) 이력서 선택
        Resume resume = (resumeIdOrNull != null)
                ? resumeRepository.findByIdAndUsers_Id(resumeIdOrNull, userId)
                .orElseThrow(() -> new ResourceNotFoundException("본인 이력서를 찾을 수 없습니다. resumeId=" + resumeIdOrNull))
                : pickLatestResume(userId);

        // 2) 공고 확인
        JobPosts post = jobPostsRepository.findById(jobPostsId)
                .orElseThrow(() -> new ResourceNotFoundException("공고를 찾을 수 없습니다. id=" + jobPostsId));

        // 3) 중복 체크 (같은 유저가 이미 이 공고에 지원했는지 확인)
        var existed = applyRepository.findByJobPosts_IdAndResume_Users_Id(post.getId(), userId);
        if (existed.isPresent()) {
            throw new IllegalStateException("이미 해당 공고에 지원하셨습니다.");
        }


        // 4) 저장
        Apply apply = Apply.builder()
                .resume(resume)
                .jobPosts(post)
                .applyAt(LocalDate.now())
                .build();

        Apply saved = applyRepository.save(apply);
        return toDto(saved);
    }

    private Resume pickLatestResume(Long userId) {
        var page = resumeRepository.findByUsers_Id(
                userId, PageRequest.of(0, 1, Sort.by(Sort.Direction.DESC, "updateAt", "createAt")));
        if (page.isEmpty() || page.getContent().isEmpty()) {
            throw new ResourceNotFoundException("등록된 이력서가 없습니다.");
        }
        return page.getContent().get(0);
    }

    private ApplyResponse toDto(Apply a) {
        String companyName = (a.getJobPosts() != null && a.getJobPosts().getCompany() != null)
                ? a.getJobPosts().getCompany().getName() : null;
        String resumeTitle = (a.getResume() != null) ? a.getResume().getTitle() : null;
        return new ApplyResponse(
                a.getId(),
                companyName,
                resumeTitle,
                a.getApplyAt()
        );
    }
}
