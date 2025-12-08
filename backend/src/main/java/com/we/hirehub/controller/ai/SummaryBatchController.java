package com.we.hirehub.controller.ai;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.we.hirehub.entity.JobPosts;
import com.we.hirehub.repository.JobPostsRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/admin/summary")
@RequiredArgsConstructor
public class SummaryBatchController {

    private final JobPostsRepository jobPostsRepository;
    private final RestTemplate rest = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    @PostMapping("/job-posts")
    public Map<String, Object> generateAllSummaries() {

        List<JobPosts> posts = jobPostsRepository.findAll();
        int success = 0;
        int failed = 0;
        int skipped = 0;

        log.info("📊 총 {}개의 공고 요약 시작", posts.size());

        for (int i = 0; i < posts.size(); i++) {
            JobPosts p = posts.get(i);

            try {
                // 이미 요약이 있고 충분히 긴 경우 스킵
                if (p.getSummary() != null && p.getSummary().length() > 100) {
                    log.info("⏭️ [{}] ID {} - 이미 요약 존재 (스킵)", i+1, p.getId());
                    skipped++;
                    continue;
                }

                // 공고 전체 구성
                String fullText = buildFullText(p);

                if (fullText.isBlank()) {
                    log.warn("⚠️ [{}] ID {} - 내용 없음 (스킵)", i+1, p.getId());
                    skipped++;
                    continue;
                }

                log.info("🔄 [{}] ID {} - 요약 요청 중... (길이: {}자)", i+1, p.getId(), fullText.length());

                // JSON body 직접 생성
                HttpHeaders headers = new HttpHeaders();
                headers.setContentType(MediaType.APPLICATION_JSON);

                String jsonBody = "{\"text\": " + objectMapper.writeValueAsString(fullText) + "}";
                HttpEntity<String> entity = new HttpEntity<>(jsonBody, headers);

                Map res = rest.postForObject(
                        "http://localhost:8000/ai/summarize",
                        entity,
                        Map.class
                );

                String summary = (String) res.get("summary");

                if (summary == null || summary.isBlank()) {
                    log.error("❌ [{}] ID {} - 요약 결과 없음", i+1, p.getId());
                    failed++;
                    continue;
                }

                // 요약이 너무 짧은 경우
                if (summary.length() < 50) {
                    log.warn("⚠️ [{}] ID {} - 요약이 너무 짧음 ({}자): {}",
                            i+1, p.getId(), summary.length(), summary);
                    // 그래도 저장은 함
                }

                p.setSummary(summary);
                jobPostsRepository.save(p);

                success++;
                log.info("✅ [{}] ID {} - 요약 완료 ({}자)", i+1, p.getId(), summary.length());

                // Rate limit 회피 - 더 긴 대기 시간
                Thread.sleep(1000);  // 250ms → 1000ms

            } catch (Exception e) {
                failed++;
                log.error("❌ [{}] ID {} - 예외 발생: {}", i+1, p.getId(), e.getMessage());
                e.printStackTrace();

                // 연속 실패 시 더 긴 대기
                try {
                    Thread.sleep(2000);
                } catch (InterruptedException ie) {
                    Thread.currentThread().interrupt();
                }
            }
        }

        log.info("📊 요약 완료 - 성공: {}, 실패: {}, 스킵: {}, 전체: {}",
                success, failed, skipped, posts.size());

        return Map.of(
                "total", posts.size(),
                "success", success,
                "failed", failed,
                "skipped", skipped
        );
    }

    /**
     * 공고의 전체 텍스트 조합
     */
    private String buildFullText(JobPosts p) {
        StringBuilder sb = new StringBuilder();

        // 제목
        if (p.getTitle() != null && !p.getTitle().isBlank()) {
            sb.append("제목: ").append(p.getTitle()).append("\n\n");
        }

        // 회사명
        if (p.getCompany() != null && p.getCompany().getName() != null) {
            sb.append("회사: ").append(p.getCompany().getName()).append("\n\n");
        }

        // 공고 내용
        if (p.getContent() != null && !p.getContent().isBlank()) {
            sb.append("공고 내용:\n").append(p.getContent()).append("\n\n");
        }

        // 주요업무
        if (p.getMainJob() != null && !p.getMainJob().isBlank()) {
            sb.append("주요 업무:\n").append(p.getMainJob()).append("\n\n");
        }

        // 자격요건
        if (p.getQualification() != null && !p.getQualification().isBlank()) {
            sb.append("자격 요건:\n").append(p.getQualification()).append("\n\n");
        }

        // 우대사항
        if (p.getPreference() != null && !p.getPreference().isBlank()) {
            sb.append("우대 사항:\n").append(p.getPreference()).append("\n\n");
        }

        // 직무, 경력, 학력 등 메타데이터
        if (p.getPosition() != null) {
            sb.append("직무: ").append(p.getPosition()).append("\n");
        }
        if (p.getCareerLevel() != null) {
            sb.append("경력: ").append(p.getCareerLevel()).append("\n");
        }
        if (p.getEducation() != null) {
            sb.append("학력: ").append(p.getEducation()).append("\n");
        }

        return sb.toString().trim();
    }

    @PostMapping("/job-posts-with-retry")
    public Map<String, Object> generateAllSummariesWithRetry() {
        List<JobPosts> posts = jobPostsRepository.findAll();
        int success = 0;
        int failed = 0;
        int skipped = 0;

        final int MAX_RETRIES = 2;
        final int BATCH_SIZE = 10; // 10개씩 처리 후 긴 휴식

        log.info("📊 총 {}개의 공고 요약 시작 (재시도 로직 포함)", posts.size());

        for (int i = 0; i < posts.size(); i++) {
            JobPosts p = posts.get(i);
            boolean processed = false;

            // 배치 단위로 긴 휴식
            if (i > 0 && i % BATCH_SIZE == 0) {
                log.info("😴 배치 {}개 처리 완료, 5초 대기...", BATCH_SIZE);
                try {
                    Thread.sleep(5000);
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                }
            }

            // 이미 요약이 있으면 스킵
            if (p.getSummary() != null && p.getSummary().length() > 100) {
                skipped++;
                continue;
            }

            String fullText = buildFullText(p);
            if (fullText.isBlank()) {
                skipped++;
                continue;
            }

            // 재시도 로직
            for (int attempt = 1; attempt <= MAX_RETRIES && !processed; attempt++) {
                try {
                    log.info("🔄 [{}] ID {} - 시도 {}/{}", i+1, p.getId(), attempt, MAX_RETRIES);

                    HttpHeaders headers = new HttpHeaders();
                    headers.setContentType(MediaType.APPLICATION_JSON);
                    headers.set("Connection", "close"); // 연결 재사용 방지

                    String jsonBody = "{\"text\": " + objectMapper.writeValueAsString(fullText) + "}";
                    HttpEntity<String> entity = new HttpEntity<>(jsonBody, headers);

                    // 타임아웃 설정
                    rest.getInterceptors().clear();

                    Map res = rest.postForObject(
                            "http://localhost:8000/ai/summarize",
                            entity,
                            Map.class
                    );

                    String summary = (String) res.get("summary");

                    if (summary != null && !summary.isBlank() && summary.length() > 30) {
                        p.setSummary(summary);
                        jobPostsRepository.save(p);
                        success++;
                        processed = true;
                        log.info("✅ [{}] ID {} - 성공 ({}자)", i+1, p.getId(), summary.length());
                    } else {
                        log.warn("⚠️ [{}] ID {} - 요약이 너무 짧음 (시도 {}/{})",
                                i+1, p.getId(), attempt, MAX_RETRIES);
                    }

                    // 성공 시에도 대기
                    Thread.sleep(1500);

                } catch (Exception e) {
                    log.error("❌ [{}] ID {} - 시도 {}/{} 실패: {}",
                            i+1, p.getId(), attempt, MAX_RETRIES, e.getMessage());

                    if (attempt < MAX_RETRIES) {
                        // 재시도 전 대기 (exponential backoff)
                        try {
                            long waitTime = (long) (2000 * Math.pow(2, attempt - 1));
                            log.info("⏳ {}ms 후 재시도...", waitTime);
                            Thread.sleep(waitTime);
                        } catch (InterruptedException ie) {
                            Thread.currentThread().interrupt();
                        }
                    } else {
                        failed++;
                    }
                }
            }

            if (!processed && fullText.length() > 0) {
                failed++;
            }
        }

        log.info("📊 요약 완료 - 성공: {}, 실패: {}, 스킵: {}, 전체: {}",
                success, failed, skipped, posts.size());

        return Map.of(
                "total", posts.size(),
                "success", success,
                "failed", failed,
                "skipped", skipped
        );
    }
}
