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
@RequestMapping("/api/ai")
public class AiChatBotController {

    @Value("${ai.server-url}")
    private String aiServerUrl; // application.yml 또는 .properties에 설정된 FastAPI 서버 주소

    private final RestTemplate restTemplate = new RestTemplate();

    @PostMapping("/chat")
    public ResponseEntity<?> chat(@RequestBody Map<String, String> req) {
        log.info("📨 AI 챗봇 요청 수신");
        log.info("📝 요청 내용: {}", req);

        try {
            String message = req.get("message");
            if (message == null || message.trim().isEmpty()) {
                log.warn("⚠️ 메시지가 비어있음");
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "메시지를 입력해주세요"));
            }

            // ✅ FastAPI 서버 URL 지정
            String url = aiServerUrl + "/ai/chat";
            log.info("🌐 FastAPI 요청 URL: {}", url);

            // ✅ HTTP 요청 구성
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, Object>> entity =
                    new HttpEntity<>(
                            Map.of(
                                    "userId", req.get("userId"),
                                    "sessionId", req.get("sessionId"),
                                    "message", message
                            ),
                            headers
                    );

            log.debug("📤 FastAPI로 요청 전송 중...");
            ResponseEntity<Map> response =
                    restTemplate.exchange(url, HttpMethod.POST, entity, Map.class);

            log.info("✅ FastAPI 응답 수신 성공: {}", response.getStatusCode());

            // ✅ FastAPI 응답 본문에서 answer 추출
            String answer = response.getBody().get("answer").toString();
            log.debug("💬 AI 답변: {}", answer);

            return ResponseEntity.ok(Map.of("answer", answer));

        } catch (Exception e) {
            log.error("❌ FastAPI 호출 실패", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of(
                            "error", "AI 서버 오류",
                            "message", e.getMessage(),
                            "detail", "FastAPI 서버가 실행 중인지 확인해주세요"
                    ));
        }
    }

    @GetMapping("/health")
    public ResponseEntity<?> health() {
        return ResponseEntity.ok(Map.of(
                "status", "ok",
                "service", "AI Controller (no service layer)"
        ));
    }
}
