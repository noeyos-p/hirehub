package com.we.hirehub.handoff;

import com.we.hirehub.dto.HandoffDto;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.List;

/**
 * 상담사 핸드오프 요청/조회 Service (메모리 스텁)
 * - 엔티티 변경 없이 동작 확인용
 * - 실제 저장소 연동 전까지는 in-memory / no-op
 */
@Service
public class HandoffService {

    /** roomId로 PENDING 요청을 조회 (테스트용 빈 리스트 반환) */
    public List<HandoffDto> findPendingByRoomId(String roomId) {
        return Collections.emptyList();
    }

    /** 핸드오프 요청 생성 (테스트용 DTO만 만들어 반환) */
    public HandoffDto create(HandoffRequest req) {
        return HandoffDto.builder()
                .id(null)                  // 아직 DB 미연동
                .roomId(req.getRoomId())
                .userId(req.getUserId())   // 요청자가 보낸 userId 문자열
                .status("PENDING")
                .lastMessage(req.getMessage())
                .build();
    }

    /** 컨트롤러에서 바인딩되는 요청 바디 */
    public static class HandoffRequest {
        private String roomId;
        private String userId;
        private String message;

        public String getRoomId() { return roomId; }
        public void setRoomId(String roomId) { this.roomId = roomId; }

        public String getUserId() { return userId; }
        public void setUserId(String userId) { this.userId = userId; }

        public String getMessage() { return message; }
        public void setMessage(String message) { this.message = message; }
    }
}
