package com.we.hirehub.controller.admin;

import com.we.hirehub.service.support.QueuedModerationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/**
 * 검열 큐 모니터링 API
 */
@RestController
@RequestMapping("/api/admin/moderation-queue")
@RequiredArgsConstructor
public class ModerationQueueController {

    private final QueuedModerationService queuedModerationService;

    /**
     * 큐 상태 조회
     */
    @GetMapping("/status")
    public ResponseEntity<Map<String, Object>> getQueueStatus() {
        int queueSize = queuedModerationService.getQueueSize();

        return ResponseEntity.ok(Map.of(
                "queueSize", queueSize,
                "message", queueSize == 0 ? "큐가 비어있습니다" : queueSize + "개 요청 대기 중",
                "estimatedWaitSeconds", queueSize * 4  // 4초당 1개 처리
        ));
    }
}
