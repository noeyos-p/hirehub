package com.we.hirehub.repository;

import com.we.hirehub.entity.Help;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface HelpRepository extends JpaRepository<Help, Long> {

    /**
     * ✅ 최적화된 메서드 - Fetch Join 사용
     * User와 Session을 한 번에 조회하여 N+1 문제 해결
     *
     * 상담사-유저 채팅 메시지 조회용
     */
    @Query("SELECT h FROM Help h " +
            "LEFT JOIN FETCH h.users " +
            "LEFT JOIN FETCH h.session " +
            "WHERE h.session.id = :sessionId " +
            "AND h.content IS NOT NULL " +
            "ORDER BY h.createAt DESC")
    List<Help> findBySessionIdWithUser(@Param("sessionId") String sessionId, Pageable pageable);

    /**
     * ✅ 특정 세션의 가장 최근 Help 레코드 조회
     * 상담 상태 관리용 (requestAt, startAt, endAt)
     */
    @Query("SELECT h FROM Help h " +
            "WHERE h.session.id = :sessionId " +
            "ORDER BY h.requestAt DESC")
    List<Help> findLatestBySessionId(@Param("sessionId") String sessionId, Pageable pageable);

    /**
     * ✅ 미처리 상담 요청 조회 (requestAt은 있지만 startAt이 없는 경우)
     * 관리자가 로그인하지 않았을 때 요청된 상담들을 조회
     * sessionId별로 가장 최근 요청만 가져옴
     */
    @Query("SELECT h FROM Help h " +
            "LEFT JOIN FETCH h.users " +
            "LEFT JOIN FETCH h.session " +
            "WHERE h.requestAt IS NOT NULL " +
            "AND h.startAt IS NULL " +
            "AND h.id IN (" +
            "  SELECT MAX(h2.id) FROM Help h2 " +
            "  WHERE h2.requestAt IS NOT NULL " +
            "  AND h2.startAt IS NULL " +
            "  GROUP BY h2.session.id" +
            ") " +
            "ORDER BY h.requestAt DESC")
    List<Help> findPendingRequests();
}
