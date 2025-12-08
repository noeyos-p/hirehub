package com.we.hirehub.controller.ai;

import com.we.hirehub.dto.common.AiBoardControlDto;
import com.we.hirehub.entity.AiBoardControl;
import com.we.hirehub.entity.Board;
import com.we.hirehub.repository.AiBoardControlRepository;
import com.we.hirehub.repository.BoardRepository;
import com.we.hirehub.service.support.BoardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/board-control")
@RequiredArgsConstructor
public class AdminBoardControlController {

    private final BoardService boardService;
    private final AiBoardControlRepository controlRepo;
    private final BoardRepository boardRepo;

    /** 숨김 처리된 게시글 목록(사유 포함) */
    @GetMapping("/hidden")
    public List<AiBoardControlDto> listHidden() {
        return controlRepo.findAll()
                .stream()
                .map(AiBoardControlDto::toDto)
                .toList();
    }

    /** 승인(복구) */
    @PostMapping("/{controlId}/approve")
    @Transactional
    public ResponseEntity<?> approve(@PathVariable Long controlId) {
        AiBoardControl control = controlRepo.findById(controlId)
                .orElseThrow(() -> new RuntimeException("Control 기록을 찾을 수 없음"));

        Board board = control.getBoard();
        board.setHidden(false);
        boardRepo.save(board);

        control.setRole("ADMIN");
        control.setReason("관리자 승인(숨김 해제)");
        controlRepo.save(control);

        return ResponseEntity.ok(Map.of(
                "status", "ok",
                "boardId", board.getId(),
                "message", "게시글 복구 완료"
        ));
    }

    /** 삭제 (FK 안전) */
    @PostMapping("/{controlId}/delete")
    @Transactional
    public ResponseEntity<?> delete(@PathVariable Long controlId) {
        AiBoardControl control = controlRepo.findById(controlId)
                .orElseThrow(() -> new RuntimeException("Control 기록을 찾을 수 없음"));

        Long boardId = control.getBoard().getId();

        // 서비스의 안전 삭제 로직 사용 (자식→부모)
        boardService.deleteBoard(boardId);

        control.setRole("ADMIN");
        control.setReason("관리자 삭제");
        controlRepo.save(control);

        return ResponseEntity.ok(Map.of(
                "status", "ok",
                "boardId", boardId,
                "message", "게시글 및 관련 기록 삭제 완료"
        ));
    }

    /** 단건 재검열 */
    @PostMapping("/recheck/{boardId}")
    public ResponseEntity<?> recheckOne(@PathVariable Long boardId) {
        return ResponseEntity.ok(boardService.recheckOne(boardId));
    }

    /** 전체/최근 재검열 트리거 */
    @PostMapping("/recheck-all")
    public ResponseEntity<?> recheckAll(
            @RequestParam(defaultValue = "30") int days,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "200") int size,
            @RequestParam(defaultValue = "false") boolean all
    ) {
        int processed = all
                ? boardService.recheckBatchAll(page, size)
                : boardService.recheckBatchRecent(days, page, size);

        return ResponseEntity.ok(Map.of(
                "processed", processed,
                "days", days,
                "page", page,
                "size", size,
                "mode", all ? "ALL" : "RECENT"
        ));
    }
}
