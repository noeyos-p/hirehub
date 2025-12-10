package com.we.hirehub.controller.admin;

import com.we.hirehub.dto.admin.AiBoardControlDto;
import com.we.hirehub.service.admin.AiBoardControlService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/ai-board-controls")
@RequiredArgsConstructor
public class AiBoardControlController {

  private final AiBoardControlService aiBoardControlService;

  // 목록 조회
  @GetMapping
  public ResponseEntity<?> getAiBoardControls() {
    List<AiBoardControlDto> list = aiBoardControlService.getAllAiBoardControls();
    return ResponseEntity.ok(Map.of("success", true, "data", list));
  }

  // 복구 (차단 해제)
  @PostMapping("/{id}/restore")
  public ResponseEntity<?> restoreBoard(@PathVariable Long id) {
    try {
      aiBoardControlService.restoreBoard(id);
      return ResponseEntity.ok(Map.of("success", true, "message", "게시글이 복구되었습니다."));
    } catch (Exception e) {
      return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
    }
  }
}
