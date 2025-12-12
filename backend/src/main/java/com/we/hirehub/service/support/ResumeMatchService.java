package com.we.hirehub.service.support;

import com.we.hirehub.config.AiEmbeddingClient;
import com.we.hirehub.entity.JobPosts;
import com.we.hirehub.repository.JobPostsRepository;
import com.we.hirehub.util.VectorUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ResumeMatchService {

    private final JobPostsRepository jobPostsRepository;
    private final AiEmbeddingClient aiEmbeddingClient;
    private final VectorUtil vectorUtil;
    private final RestTemplate restTemplate = new RestTemplate();

    @org.springframework.beans.factory.annotation.Value("${ai.server-url}")
    private String aiServerUrl;

    public static class MatchResult {
        public Long jobId;
        public Long companyId;
        public String jobTitle;
        public String companyName;
        public double retrievalScore;
        public double aiScore;
        public String reason;
    }

    public List<MatchResult> match(Long resumeId, String resumeFullText, String resumeSummary) {

        log.info("═══════════════════════════════════════════════════════");
        log.info("🎯 매칭 프로세스 시작");
        log.info("═══════════════════════════════════════════════════════");
        log.info("📌 Resume ID: {}", resumeId);

        // 1) 이력서 임베딩 생성
        String textToEmbed = (resumeSummary != null && !resumeSummary.isBlank())
                ? resumeSummary
                : resumeFullText;

        log.info("📝 임베딩할 텍스트 길이: {}자", textToEmbed.length());
        log.info("📝 텍스트 미리보기: {}...",
                textToEmbed.length() > 100 ? textToEmbed.substring(0, 100) : textToEmbed);

        List<Double> resumeVec = aiEmbeddingClient.embed(textToEmbed);

        if (resumeVec == null || resumeVec.isEmpty()) {
            log.error("❌ 이력서 임베딩 생성 실패");
            return List.of();
        }

        log.info("✅ 이력서 임베딩 생성 완료: {}차원 벡터", resumeVec.size());

        // 2) 모든 공고 불러오기
        log.info("───────────────────────────────────────────────────────");
        log.info("📊 데이터베이스 조회 중...");

        List<JobPosts> all = jobPostsRepository.findAll();

        log.info("✅ 전체 공고 수: {}개", all.size());
        log.info("───────────────────────────────────────────────────────");

        // 임베딩 있는 공고 vs 없는 공고 분류
        long withEmbedding = all.stream()
                .filter(p -> p.getEmbedding() != null && !p.getEmbedding().isBlank())
                .count();
        long withoutEmbedding = all.size() - withEmbedding;

        log.info("📈 임베딩 있는 공고: {}개", withEmbedding);
        log.info("📉 임베딩 없는 공고: {}개 (매칭 불가)", withoutEmbedding);

        // 3) 코사인 유사도 계산
        log.info("───────────────────────────────────────────────────────");
        log.info("🔍 코사인 유사도 계산 시작...");

        List<MatchResult> retrieved = new ArrayList<>();
        int processedCount = 0;

        for (JobPosts p : all) {
            processedCount++;

            if (p.getEmbedding() == null || p.getEmbedding().isBlank()) {
                log.debug("⏭️  [{}] ID {} - 임베딩 없음 (스킵)", processedCount, p.getId());
                continue;
            }

            List<Double> jobVec = parseEmbedding(p.getEmbedding());
            if (jobVec.isEmpty()) {
                log.warn("⚠️  [{}] ID {} - 임베딩 파싱 실패", processedCount, p.getId());
                continue;
            }

            double score = vectorUtil.cosine(resumeVec, jobVec);

            MatchResult r = new MatchResult();
            r.jobId = p.getId();
            r.companyId = p.getCompany().getId();
            r.jobTitle = p.getTitle();
            r.companyName = p.getCompany().getName();
            r.retrievalScore = score;
            retrieved.add(r);

            log.debug("✓ [{}] ID {} - 유사도: {:.4f} | {}",
                    processedCount, p.getId(), score, p.getTitle());
        }

        log.info("✅ 유사도 계산 완료: {}개 공고 처리됨", retrieved.size());

        // Retrieval 점수로 정렬
        retrieved.sort((a, b) -> Double.compare(b.retrievalScore, a.retrievalScore));

        log.info("───────────────────────────────────────────────────────");
        log.info("🏆 상위 10개 공고 선정");
        log.info("───────────────────────────────────────────────────────");

        // 상위 10개 추출
        List<MatchResult> top10 = retrieved.stream()
                .limit(10)
                .collect(Collectors.toList());

        // 상위 10개 출력
        for (int i = 0; i < top10.size(); i++) {
            MatchResult r = top10.get(i);
            log.info("{}위. [ID {}] {} - {} (유사도: {:.4f})",
                    i + 1, r.jobId, r.companyName, r.jobTitle, r.retrievalScore);
        }

        log.info("───────────────────────────────────────────────────────");
        log.info("🤖 AI 정밀 매칭 시작 (상위 10개 대상)");
        log.info("───────────────────────────────────────────────────────");

        // 4) FastAPI LLM 정밀 매칭
        int successCount = 0;
        int failCount = 0;

        for (int i = 0; i < top10.size(); i++) {
            MatchResult item = top10.get(i);

            JobPosts jp = all.stream()
                    .filter(x -> x.getId().equals(item.jobId))
                    .findFirst()
                    .orElse(null);

            if (jp == null) {
                log.warn("⚠️  [{}] ID {} - 공고를 찾을 수 없음", i+1, item.jobId);
                item.aiScore = 0.0;
                item.reason = "공고 정보 없음";
                failCount++;
                continue;
            }

            if (jp.getSummary() == null || jp.getSummary().isBlank()) {
                log.warn("⚠️  [{}] ID {} - 요약 없음", i+1, item.jobId);
                item.aiScore = 0.0;
                item.reason = "공고 요약 정보 없음";
                failCount++;
                continue;
            }

            try {
                log.info("🔄 [{}] ID {} - AI 매칭 요청 중...", i+1, item.jobId);

                String resultJson = callMatch(resumeSummary, jp.getSummary());
                Map<String, Object> parsed = parseJson(resultJson);

                item.aiScore = toDouble(parsed.get("score"));
                item.reason = String.valueOf(parsed.getOrDefault("reason", "분석 완료"));

                if (item.aiScore > 0) {
                    log.info("✅ [{}] ID {} - AI 점수: {}점 | {}",
                            i+1, item.jobId, item.aiScore, item.reason);
                    successCount++;
                } else {
                    log.warn("⚠️  [{}] ID {} - 0점 반환", i+1, item.jobId);
                    failCount++;
                }

            } catch (Exception e) {
                log.error("❌ [{}] ID {} - 매칭 실패: {}", i+1, item.jobId, e.getMessage());
                item.aiScore = 0.0;
                item.reason = "매칭 오류";
                failCount++;
            }

            // Rate limit 방지
            try {
                Thread.sleep(300);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
        }

        log.info("───────────────────────────────────────────────────────");
        log.info("📊 AI 매칭 결과: 성공 {}개, 실패 {}개", successCount, failCount);
        log.info("───────────────────────────────────────────────────────");

        // 5) 최종 정렬
        List<MatchResult> finalResults = top10.stream()
                .sorted((a, b) -> {
                    int cmp = Double.compare(b.aiScore, a.aiScore);
                    if (cmp != 0) return cmp;
                    return Double.compare(b.retrievalScore, a.retrievalScore);
                })
                .toList();

        log.info("═══════════════════════════════════════════════════════");
        log.info("🎉 매칭 완료 - 최종 결과 {}개 반환", finalResults.size());
        log.info("═══════════════════════════════════════════════════════");

        return finalResults;
    }

    private String callMatch(String resumeSummary, String jobSummary) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        String resumeText = nvl(resumeSummary);
        String jobText = nvl(jobSummary);

        if (resumeText.length() > 1000) {
            resumeText = resumeText.substring(0, 1000);
        }
        if (jobText.length() > 1000) {
            jobText = jobText.substring(0, 1000);
        }

        Map<String, Object> body = Map.of(
                "resume", resumeText,
                "job", jobText
        );

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);

        try {
            var res = restTemplate.postForEntity(
                    aiServerUrl + "/ai/match-one",
                    entity,
                    Map.class
            );

            return new com.fasterxml.jackson.databind.ObjectMapper()
                    .writeValueAsString(res.getBody());

        } catch (Exception e) {
            log.error("❌ FastAPI 호출 실패: {}", e.getMessage());
            return "{\"score\":0,\"reason\":\"API 호출 실패\"}";
        }
    }

    private String nvl(String s) {
        return (s == null || s.isBlank()) ? "" : s;
    }

    private List<Double> parseEmbedding(String json) {
        try {
            var node = new com.fasterxml.jackson.databind.ObjectMapper().readTree(json);
            List<Double> out = new ArrayList<>();
            for (var it : node) {
                out.add(it.asDouble());
            }
            return out;
        } catch (Exception e) {
            return List.of();
        }
    }

    private Map<String, Object> parseJson(String s) {
        try {
            return new com.fasterxml.jackson.databind.ObjectMapper()
                    .readValue(s, Map.class);
        } catch (Exception e) {
            return Map.of("score", 0, "reason", "JSON 파싱 오류");
        }
    }

    private double toDouble(Object o) {
        if (o == null) return 0.0;
        if (o instanceof Number n) return n.doubleValue();
        try {
            return Double.parseDouble(String.valueOf(o));
        } catch (Exception e) {
            return 0.0;
        }
    }
}
