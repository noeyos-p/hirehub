package com.we.hirehub.service.support;

import com.we.hirehub.entity.AiBoardControl;
import com.we.hirehub.entity.Board;
import com.we.hirehub.repository.AiBoardControlRepository;
import com.we.hirehub.repository.BoardRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class AsyncModerationService {

  private final BoardRepository boardRepository;
  private final QueuedModerationService queuedModerationService;  // ✅ 큐 기반으로 변경
  private final AiBoardControlRepository controlRepo;

  @Async
  @Transactional(propagation = Propagation.REQUIRES_NEW)
  public void moderateBoardAsync(Long boardId, int delaySeconds) {
    try {
      // 지연 시간
      if (delaySeconds > 0) {
        Thread.sleep(delaySeconds * 1000L);
      }

      Board board = boardRepository.findById(boardId).orElse(null);
      if (board == null) {
        log.warn("⚠️ [ASYNC_MOD] 게시글 없음 boardId={}", boardId);
        return;
      }

      log.info("🔄 [ASYNC_MOD] 비동기 검열 시작 boardId={}", boardId);

      // ✅ 큐를 통해 처리 (속도 제한 적용)
      var mres = queuedModerationService.moderate(board.getTitle(), board.getContent());
      applyModeration(board, mres);
      boardRepository.save(board);

      log.info("✅ [ASYNC_MOD] 검열 완료 boardId={}, hidden={}", boardId, board.getHidden());

    } catch (InterruptedException e) {
      Thread.currentThread().interrupt();
      log.error("❌ [ASYNC_MOD] 비동기 검열 중단 boardId={}", boardId);
    } catch (Exception e) {
      log.error("💥 [ASYNC_MOD] 비동기 검열 실패 boardId={}", boardId, e);
    }
  }

  private void applyModeration(Board board, QueuedModerationService.ModerationResult mres) {  // ✅ 타입 변경
    boolean before = Boolean.TRUE.equals(board.getHidden());
    boolean approved = mres.approved();

    // 🔥 관리자가 승인한 게시글이면 AI가 다시 숨기지 않음
    if (Boolean.TRUE.equals(board.getAdminApproved())) {
      log.info("🛡️ [AI_SKIP] 관리자 승인 게시글입니다. AI 차단을 건너뜁니다. boardId={}", board.getId());
      return;
    }

    board.setHidden(!approved);

    log.info("🧩 [MODERATION] boardId={}, before={}, after={}, approved={}, reason={}",
        board.getId(), before, board.getHidden(), approved, mres.reason());

    if (!approved) {
      try {
        AiBoardControl control = AiBoardControl.builder()
            .board(board)
            .reason(mres.reason())
            .role("BOT")
            .build();
        controlRepo.save(control);
        log.info("📝 [AI_CONTROL] 저장완료 - boardId={}, reason={}", board.getId(), mres.reason());
      } catch (Exception e) {
        log.error("⚠️ [AI_CONTROL] 저장 실패 - boardId={}", board.getId(), e);
      }
    }
  }
}
