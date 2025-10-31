package com.we.hirehub.handoff;

import com.we.hirehub.dto.HandoffDto;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 핸드오프 REST 엔드포인트
 * - /api/handoff?roomId=xxx  (대기중 목록)
 * - POST /api/handoff        (요청 생성)
 */
@RestController
@RequestMapping("/api/handoff")
@RequiredArgsConstructor
public class HandoffController {

    private final HandoffService service;

    @GetMapping
    public ResponseEntity<List<HandoffDto>> getPending(@RequestParam String roomId) {
        return ResponseEntity.ok(service.findPendingByRoomId(roomId));
    }

    @PostMapping
    public ResponseEntity<HandoffDto> create(@RequestBody HandoffService.HandoffRequest request) {
        return ResponseEntity.ok(service.create(request));
    }
}
