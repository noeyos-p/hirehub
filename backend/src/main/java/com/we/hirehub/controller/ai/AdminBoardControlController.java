package com.we.hirehub.controller.ai;

import com.we.hirehub.dto.common.AiBoardControlDto;
import com.we.hirehub.entity.AiBoardControl;
import com.we.hirehub.entity.Board;
import com.we.hirehub.repository.AiBoardControlRepository;
import com.we.hirehub.repository.BoardRepository;
import com.we.hirehub.service.support.BoardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/board-control")
@RequiredArgsConstructor
public class AdminBoardControlController {

    private final BoardService boardService;
    private final AiBoardControlRepository controlRepo;
    private final BoardRepository boardRepo;

    /** 1️⃣ 숨김 처리된 게시글 목록 */
    @GetMapping("/hidden")
    public List<AiBoardControlDto> listHidden() {
        return controlRepo.findAll()
                .stream().map(AiBoardControlDto::toDto)
                .toList();
    }

    /** 2️⃣ 승인(복구) */
    @PostMapping("/{controlId}/approve")
    public ResponseEntity<?> approve(@PathVariable Long controlId) {
        AiBoardControl control = controlRepo.findById(controlId)
                .orElseThrow();

        Board board = control.getBoard();
        board.setHidden(false);
        boardRepo.save(board);

        control.setRole("ADMIN"); // 관리자 승인 기록
        controlRepo.save(control);

        return ResponseEntity.ok("복구 완료");
    }

    /** 3️⃣ 삭제 */
    @PostMapping("/{controlId}/delete")
    public ResponseEntity<?> delete(@PathVariable Long controlId) {
        AiBoardControl control = controlRepo.findById(controlId)
                .orElseThrow();

        Board board = control.getBoard();
        boardRepo.delete(board);

        control.setRole("ADMIN"); // 관리자 처리 기록
        controlRepo.save(control);

        return ResponseEntity.ok("삭제 완료");
    }
}
