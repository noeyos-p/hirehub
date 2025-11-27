package com.we.hirehub.controller.ai;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/resume")
public class ResumeAiController {

    @Value("${ai.server-url}")
    private String aiServerUrl; // 🔹 FastAPI 서버 주소 (ex: http://localhost:8000)

    private final RestTemplate restTemplate = new RestTemplate();

    @PostMapping("/ai-review")
    public Map<String, Object> aiReview(@RequestBody Map<String, String> payload) {
        log.info("📨 이력서 AI 분석 요청 수신");
        log.info("📝 요청 내용: {}", payload);

        String content = payload.get("content");
        if (content == null || content.trim().isEmpty()) {
            log.warn("⚠️ content 필드가 비어있음");
            return Map.of("error", "이력서 내용을 입력해주세요.");
        }

        try {
            // ✅ FastAPI URL 지정
            String url = aiServerUrl + "/ai/review";
            log.info("🌐 FastAPI 요청 URL: {}", url);

            // ✅ 요청 헤더 및 본문 구성
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, String>> entity =
                    new HttpEntity<>(Map.of("content", content), headers);

            log.debug("📤 FastAPI로 요청 전송 중...");
            ResponseEntity<Map> response =
                    restTemplate.exchange(url, HttpMethod.POST, entity, Map.class);

            log.info("✅ FastAPI 응답 수신 성공: {}", response.getStatusCode());

            // ✅ 응답 데이터 추출
            Object feedback = response.getBody().get("feedback");
            log.debug("💬 AI 피드백: {}", feedback);

            return Map.of("feedback", feedback);

        } catch (Exception e) {
            log.error("❌ FastAPI 호출 실패", e);
            return Map.of(
                    "error", "AI 서버 연결 실패",
                    "message", e.getMessage(),
                    "detail", "FastAPI 서버가 실행 중인지 확인해주세요."
            );
        }
    }
}
