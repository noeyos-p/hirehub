package com.we.hirehub.repository;

import com.we.hirehub.entity.ChatBot;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ChatBotRepository extends JpaRepository<ChatBot, Long> {

    /**
     * onoff가 true인 FAQ 목록 조회 (활성화된 것만)
     */
    List<ChatBot> findByOnoffTrueOrderByIdAsc(Pageable pageable);

    /**
     * ✨ type="item"인 FAQ만 조회 (Native Query)
     */
    @Query(value = """
        SELECT * FROM chat_bot 
        WHERE onoff = 1 
        AND JSON_EXTRACT(meta, '$.type') = 'item'
        ORDER BY id ASC 
        LIMIT 4
        """, nativeQuery = true)
    List<ChatBot> findFaqItems();

    /**
     * ✨ Native Query로 전체 FAQ 조회 (Session 조인 문제 회피)
     */
    @Query(value = "SELECT * FROM chat_bot ORDER BY id ASC", nativeQuery = true)
    List<ChatBot> findAllByOrderByIdAscNative();

    /**
     * 전체 FAQ 조회 (기존 메서드 - 유지)
     */
    List<ChatBot> findAllByOrderByIdAsc();

    /**
     * ✨ type="item"인 FAQ 4개만 조회
     */
    @Query(value = """
    SELECT * FROM chat_bot 
    WHERE onoff = 1 
    AND JSON_EXTRACT(meta, '$.type') = 'item'
    ORDER BY JSON_EXTRACT(meta, '$.order'), id ASC 
    LIMIT 4
    """, nativeQuery = true)
    List<ChatBot> findTop4FaqItems();
}
