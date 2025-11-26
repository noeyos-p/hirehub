package com.we.hirehub.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class AiService {

    private final RestTemplate restTemplate;

    @Value("${ai.server-url}")
    private String aiServerUrl;

    public String ask(String message) {
        String url = aiServerUrl + "/ai/chat";

        log.info("🤖 AI 서버 호출 시작");
        log.info("📍 URL: {}", url);
        log.info("💬 메시지: {}", message);

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            HttpEntity<Map<String, String>> req =
                    new HttpEntity<>(Map.of("message", message), headers);

            log.debug("📤 요청 전송 중...");
            ResponseEntity<Map> resp =
                    restTemplate.exchange(url, HttpMethod.POST, req, Map.class);

            log.info("✅ AI 서버 응답 성공: {}", resp.getStatusCode());

            String answer = resp.getBody().get("answer").toString();
            log.debug("💡 AI 답변: {}", answer);

            return answer;

        } catch (Exception e) {
            log.error("❌ AI 서버 호출 실패", e);
            log.error("❌ 에러 메시지: {}", e.getMessage());
            log.error("❌ 에러 타입: {}", e.getClass().getName());

            // 구체적인 에러 메시지 반환
            throw new RuntimeException("AI 서버 연결 실패: " + e.getMessage(), e);
        }
    }
}
