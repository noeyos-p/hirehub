package com.we.hirehub.service.support;

import com.we.hirehub.dto.support.JobPostsDto;
import com.we.hirehub.entity.JobPosts;
import com.we.hirehub.repository.JobPostsRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.Async;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class JobPostAiAsyncService {

    private final JobPostsRepository jobPostsRepository;
    private final JobPostAiService jobPostAiService;

    @Async  // ⭐ 비동기 처리
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void generateSummaryAndEmbeddingAsync(Long jobPostId) {
        log.info("🔄 [ASYNC_AI] 비동기 AI 처리 시작 - 공고 ID: {}", jobPostId);

        try {
            JobPosts jobPost = jobPostsRepository.findById(jobPostId)
                    .orElse(null);

            if (jobPost == null) {
                log.warn("⚠️ [ASYNC_AI] 공고 없음 - ID: {}", jobPostId);
                return;
            }

            // AI 처리
            jobPost = jobPostAiService.generateSummaryAndEmbedding(jobPost);
            jobPostsRepository.save(jobPost);

            log.info("✅ [ASYNC_AI] AI 처리 완료 - 공고 ID: {}", jobPostId);

        } catch (Exception e) {
            log.error("❌ [ASYNC_AI] AI 처리 실패 - 공고 ID: {}", jobPostId, e);
        }
    }

}