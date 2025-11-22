package com.we.hirehub.repository;

import com.we.hirehub.entity.LiveChat;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface LiveChatRepository extends JpaRepository<LiveChat, Long> {

    /**
     * ⚠️ 기존 메서드 - 호환성을 위해 유지
     * N+1 문제가 발생할 수 있으므로 되도록 사용하지 않는 것을 권장
     */
    List<LiveChat> findBySessionId(String sessionId, Pageable pageable);

    /**
     * ✅ 최적화된 메서드 - Fetch Join 사용
     * User와 Session을 한 번에 조회하여 N+1 문제 해결
     *
     * 성능 비교:
     * - 기존: 채팅 30개 조회 시 쿼리 31번 실행 (채팅 1번 + 유저 30번)
     * - 최적화: 채팅 30개 조회 시 쿼리 1번 실행 (JOIN으로 한 번에)
     */
    @Query("SELECT lc FROM LiveChat lc " +
            "LEFT JOIN FETCH lc.user " +
            "LEFT JOIN FETCH lc.session " +
            "WHERE lc.session.id = :sessionId " +
            "ORDER BY lc.createAt DESC")
    List<LiveChat> findBySessionIdWithUser(@Param("sessionId") String sessionId, Pageable pageable);

}
