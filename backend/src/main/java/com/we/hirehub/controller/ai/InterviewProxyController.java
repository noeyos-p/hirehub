package com.we.hirehub.controller.ai;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/interview")
@RequiredArgsConstructor
public class InterviewProxyController {

    @Value("${ai.server-url}")
    private String aiServerUrl; // FastAPI 서버 주소

    private final RestTemplate restTemplate;

    /**
     * 면접 질문 생성 API 프록시
     * POST /api/interview/generate-questions
     */
    @PostMapping("/generate-questions")
    public ResponseEntity<?> generateQuestions(@RequestBody Map<String, Object> request) {
        log.info("📝 면접 질문 생성 요청 수신");
        log.debug("요청 내용: {}", request);

        try {
            String url = aiServerUrl + "/interview/generate-questions";
            log.info("🌐 FastAPI 요청 URL: {}", url);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(request, headers);

            ResponseEntity<Object> response = restTemplate.exchange(
                url,
                HttpMethod.POST,
                entity,
                Object.class
            );

            log.info("✅ FastAPI 응답 수신 성공: {}", response.getStatusCode());
            return ResponseEntity.ok(response.getBody());

        } catch (Exception e) {
            log.error("❌ 면접 질문 생성 실패", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of(
                    "error", "면접 질문 생성 실패",
                    "message", e.getMessage()
                ));
        }
    }

    /**
     * 면접 답변 피드백 API 프록시
     * POST /api/interview/feedback
     */
    @PostMapping("/feedback")
    public ResponseEntity<?> getFeedback(@RequestBody Map<String, Object> request) {
        log.info("💬 면접 피드백 요청 수신");
        log.debug("요청 내용: {}", request);

        try {
            String url = aiServerUrl + "/interview/feedback";
            log.info("🌐 FastAPI 요청 URL: {}", url);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(request, headers);

            ResponseEntity<Object> response = restTemplate.exchange(
                url,
                HttpMethod.POST,
                entity,
                Object.class
            );

            log.info("✅ FastAPI 응답 수신 성공: {}", response.getStatusCode());
            return ResponseEntity.ok(response.getBody());

        } catch (Exception e) {
            log.error("❌ 면접 피드백 생성 실패", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of(
                    "error", "면접 피드백 생성 실패",
                    "message", e.getMessage()
                ));
        }
    }
}
