package com.we.hirehub.repository;

import com.we.hirehub.entity.LiveChat;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface LiveChatRepository extends JpaRepository<LiveChat, Long> {
    List<LiveChat> findBySessionId(String sessionId, Pageable pageable);
}
