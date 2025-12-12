package com.we.hirehub.config;

import com.we.hirehub.controller.ai.BoardAiController;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@EnableScheduling
@RequiredArgsConstructor
public class SchedulerConfig {

    private final BoardAiController boardAiController;

    /** ⏰ 1시간마다 자동 뉴스 게시글 발행 */
    // @Scheduled(fixedRate = 60 * 60 * 1000)  // 🔥 자동 생성 비활성화
    public void autoPublishNews() {
        try {
            log.info("⏳ [AI 자동 게시글 생성 시작]");
            boardAiController.autoPublish();
            log.info("✅ [AI 자동 게시글 생성 완료]");
        } catch (Exception e) {
            log.error("🔥 자동 생성 오류", e);
        }
    }
}
