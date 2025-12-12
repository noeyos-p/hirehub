package com.we.hirehub.service.support;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import jakarta.annotation.PostConstruct;
import java.util.Map;
import java.util.concurrent.*;

/**
 * 큐 기반 속도 제한 검열 서비스
 * - 분당 15회 제한을 준수하기 위해 큐로 관리
 * - 4초마다 1개씩 처리 (15개/분)
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class QueuedModerationService {

    @Value("${ai.server-url:http://localhost:8000}")
    private String aiServerUrl;

    private final RestTemplate restTemplate = new RestTemplate();

    // 요청 큐 (최대 1000개)
    private final BlockingQueue<ModerationRequest> queue = new LinkedBlockingQueue<>(1000);

    public record ModerationRequest(
            String title,
            String content,
            CompletableFuture<ModerationResult> future
    ) {}

    public record ModerationResult(boolean approved, String reason, Map<String, Object> raw) {}

    @PostConstruct
    public void init() {
        log.info("🚀 QueuedModerationService 초기화 완료");
    }

    /**
     * 검열 요청을 큐에 추가
     */
    public CompletableFuture<ModerationResult> moderateAsync(String title, String content) {
        CompletableFuture<ModerationResult> future = new CompletableFuture<>();

        ModerationRequest request = new ModerationRequest(title, content, future);

        boolean added = queue.offer(request);

        if (!added) {
            log.warn("⚠️ [QUEUE] 큐가 가득 참 - 즉시 승인 처리");
            future.complete(new ModerationResult(true, "큐 포화(임시 승인)", Map.of()));
        } else {
            log.info("📥 [QUEUE] 요청 추가됨 - 대기 중: {}", queue.size());
        }

        return future;
    }

    /**
     * 4초마다 큐에서 1개씩 처리 (분당 15개)
     */
    @Scheduled(fixedDelay = 4000, initialDelay = 1000)
    public void processQueue() {
        ModerationRequest request = queue.poll();

        if (request == null) {
            return; // 큐가 비어있음
        }

        log.info("🔄 [QUEUE] 처리 시작 - 남은 대기: {}", queue.size());

        try {
            ModerationResult result = callAiModeration(request.title(), request.content());
            request.future().complete(result);
            log.info("✅ [QUEUE] 처리 완료 - approved={}", result.approved());

        } catch (Exception e) {
            log.error("💥 [QUEUE] 처리 실패", e);
            request.future().complete(
                new ModerationResult(true, "검열 실패(임시 승인): " + e.getMessage(), Map.of())
            );
        }
    }

    /**
     * 실제 AI 서버 호출
     */
    private ModerationResult callAiModeration(String title, String content) {
        String url = aiServerUrl + "/ai/moderate";
        String payloadContent = (title == null ? "" : title) + "\n" + (content == null ? "" : content);

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            Map<String, String> payload = Map.of("content", payloadContent);
            HttpEntity<Map<String, String>> entity = new HttpEntity<>(payload, headers);

            log.info("📡 [AI-REQ] url={}, size={}", url, payloadContent.length());

            ResponseEntity<Map> res = restTemplate.exchange(url, HttpMethod.POST, entity, Map.class);
            Map<String, Object> body = res.getBody();

            if (body == null) {
                log.warn("⚠️ [AI-RES] 응답 body가 null");
                return new ModerationResult(true, "AI 서버 응답 없음(임시 승인)", Map.of());
            }

            boolean approved = toBool(body.get("approve"), true);
            String reason = s(body.get("reason"), "사유 없음");

            log.info("📡 [AI-RES] approved={}, reason={}", approved, reason);

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
     * 동기 버전 - 즉시 결과 필요한 경우
     */
    public ModerationResult moderate(String title, String content) {
        try {
            return moderateAsync(title, content).get(30, TimeUnit.SECONDS);
        } catch (TimeoutException e) {
            log.error("⏱️ [QUEUE] 타임아웃 - 30초 초과", e);
            return new ModerationResult(true, "타임아웃(임시 승인)", Map.of());
        } catch (Exception e) {
            log.error("💥 [QUEUE] 동기 검열 실패", e);
            return new ModerationResult(true, "검열 실패(임시 승인)", Map.of());
        }
    }

    // 큐 상태 확인
    public int getQueueSize() {
        return queue.size();
    }

    private static boolean toBool(Object v, boolean def) {
        if (v instanceof Boolean b) return b;
        if (v instanceof String s) return Boolean.parseBoolean(s.trim());
        if (v instanceof Number n) return n.intValue() != 0;
        return def;
    }

    private static String s(Object v, String def) {
        return v == null ? def : String.valueOf(v);
    }
}
