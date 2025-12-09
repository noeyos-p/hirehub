package com.we.hirehub.service.support;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.we.hirehub.config.AiEmbeddingClient;
import com.we.hirehub.entity.JobPosts;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class JobPostAiService {

    private final RestTemplate restTemplate = new RestTemplate();
    private final AiEmbeddingClient aiEmbeddingClient;
    private final ObjectMapper objectMapper = new ObjectMapper();

    /**
     * 공고의 Summary와 Embedding을 자동 생성
     * @param jobPost 공고 엔티티
     * @return 업데이트된 공고 (save는 호출하지 않음)
     */
    public JobPosts generateSummaryAndEmbedding(JobPosts jobPost) {
        log.info("🤖 AI 처리 시작 - 공고 ID: {}", jobPost.getId());

        try {
            // 1. 전체 텍스트 구성
            String fullText = buildFullText(jobPost);

            if (fullText.isBlank()) {
                log.warn("⚠️ 공고 내용이 비어있음 - AI 처리 스킵");
                return jobPost;
            }

            log.info("📝 전체 텍스트 길이: {}자", fullText.length());

            // 2. Summary 생성
            String summary = generateSummary(fullText);

            if (summary != null && !summary.isBlank() && summary.length() > 30) {
                jobPost.setSummary(summary);
                log.info("✅ Summary 생성 완료: {}자", summary.length());
            } else {
                log.warn("⚠️ Summary 생성 실패 또는 너무 짧음");
            }

            // 3. Embedding 생성 (Summary 기반)
            String textForEmbedding = (summary != null && !summary.isBlank())
                    ? summary
                    : fullText;

            List<Double> embedding = aiEmbeddingClient.embed(textForEmbedding);

            if (embedding != null && !embedding.isEmpty()) {
                String embeddingJson = objectMapper.writeValueAsString(embedding);
                jobPost.setEmbedding(embeddingJson);
                log.info("✅ Embedding 생성 완료: {}차원", embedding.size());
            } else {
                log.warn("⚠️ Embedding 생성 실패");
            }

            log.info("🎉 AI 처리 완료 - 공고 ID: {}", jobPost.getId());

        } catch (Exception e) {
            log.error("❌ AI 처리 실패 - 공고 ID: {}, 오류: {}", jobPost.getId(), e.getMessage());
            // 실패해도 공고는 저장되도록 예외를 던지지 않음
        }

        return jobPost;
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

        // 메타데이터
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

    /**
     * FastAPI를 통해 Summary 생성
     */
    private String generateSummary(String fullText) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            String jsonBody = "{\"text\": " + objectMapper.writeValueAsString(fullText) + "}";
            HttpEntity<String> entity = new HttpEntity<>(jsonBody, headers);

            Map response = restTemplate.postForObject(
                    "http://localhost:8000/ai/summarize",
                    entity,
                    Map.class
            );

            if (response != null) {
                String summary = (String) response.get("summary");

                // 유효성 검증
                if (summary != null && !summary.contains("요약 부족으로 재생성 불가")
                        && !summary.contains("모델 무응답")) {
                    return summary;
                }
            }

            return null;

        } catch (Exception e) {
            log.error("Summary 생성 API 호출 실패: {}", e.getMessage());
            return null;
        }
    }
}
