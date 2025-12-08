package com.we.hirehub.service.support;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.Map;
import java.util.concurrent.CompletableFuture;

@Slf4j
@Service
@RequiredArgsConstructor
public class ModerationService {

    @Value("${ai.server-url:http://localhost:8000}")
    private String aiServerUrl;

    private final RestTemplate restTemplate = new RestTemplate();

    public record ModerationResult(boolean approved, String reason, Map<String, Object> raw) {}

    private static boolean toBool(Object v, boolean def) {
        if (v instanceof Boolean b) return b;
        if (v instanceof String s) return Boolean.parseBoolean(s.trim());
        if (v instanceof Number n) return n.intValue() != 0;
        return def;
    }

    private static String s(Object v, String def) {
        return v == null ? def : String.valueOf(v);
    }

    /**
     * 동기 버전 - 즉시 결과 필요한 경우 (단건 재검열 등)
     */
    public ModerationResult moderate(String title, String content) {
        String url = aiServerUrl + "/ai/moderate";
        String payloadContent = (title == null ? "" : title) + "\n" + (content == null ? "" : content);

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            Map<String, String> payload = Map.of("content", payloadContent);
            HttpEntity<Map<String, String>> entity = new HttpEntity<>(payload, headers);

            log.info("📡 [AI-REQ] url={}, size={}, preview={}",
                    url,
                    payloadContent.length(),
                    payloadContent.replace("\n", "\\n")
                            .substring(0, Math.min(120, payloadContent.length())));

            ResponseEntity<Map> res = restTemplate.exchange(url, HttpMethod.POST, entity, Map.class);
            Map<String, Object> body = res.getBody();

            if (body == null) {
                log.warn("⚠️ [AI-RES] 응답 body가 null입니다");
                return new ModerationResult(true, "AI 서버 응답 없음(임시 승인)", Map.of());
            }

            boolean approved = toBool(body.get("approve"), true);
            String reason = s(body.get("reason"), "사유 없음");

            log.info("📡 [AI-RES] status={}, approved={}, reason={}",
                    res.getStatusCode(), approved, reason);

            return new ModerationResult(approved, reason, body);

        } catch (Exception e) {
            log.error("💥 [AI-ERR] AI 서버 통신 실패", e);
            return new ModerationResult(
                    true,
                    "AI 서버 오류(임시 승인): " + e.getMessage(),
                    Map.of("error", e.toString())
            );
        }
    }

    /**
     * 비동기 버전 - 백그라운드 검열용 (작성/수정 시)
     * CompletableFuture로 즉시 반환
     */
    @Async
    public CompletableFuture<ModerationResult> moderateAsync(String title, String content) {
        log.info("🔄 [ASYNC] 비동기 검열 시작");
        ModerationResult result = moderate(title, content);
        log.info("✅ [ASYNC] 비동기 검열 완료 - approved={}", result.approved());
        return CompletableFuture.completedFuture(result);
    }
}
