package com.we.hirehub.controller;

import com.we.hirehub.service.AiService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
public class AiController {

    private final AiService aiService;

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

            log.debug("🔄 AiService 호출 중...");
            String answer = aiService.ask(message);

            log.info("✅ AI 응답 성공");
            return ResponseEntity.ok(Map.of("answer", answer));

        } catch (Exception e) {
            log.error("❌ AI 챗봇 에러 발생", e);
            log.error("❌ 에러 상세: {}", e.getMessage());

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
                "service", "AI Controller"
        ));
    }
}
