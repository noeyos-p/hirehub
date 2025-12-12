package com.we.hirehub.scheduler;

import com.we.hirehub.service.support.BoardService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class ModerationScheduler {
    private final BoardService boardService;

    // ✅ 1시간마다 최근 1일 게시글 재검열 (선택사항)
    // @Scheduled(fixedRate = 3600000)  // 주석 해제하면 활성화 (1시간마다)
    public void recheckRecentPosts() {
        long ts = System.currentTimeMillis();
        log.info("⏱️ [SCHED] 주기 재검열 시작 ts={}", ts);

        int processed = boardService.recheckBatchRecent(1, 0, 50);

        log.info("⏱️ [SCHED] 재검열 완료 ts={}, 처리건수={}", ts, processed);
    }
}

