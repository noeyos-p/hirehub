package com.we.hirehub.repository;

import com.we.hirehub.entity.TokenHistory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TokenHistoryRepository extends JpaRepository<TokenHistory, Long> {

    List<TokenHistory> findByUserIdOrderByCreatedAtDesc(Long userId);

    List<TokenHistory> findAllByUserIdOrderByCreatedAtDesc(Long userId);

}
