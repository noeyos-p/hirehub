package com.we.hirehub.repository;

import com.we.hirehub.entity.CoverLetterHistory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CoverLetterHistoryRepository extends JpaRepository<CoverLetterHistory, Long> {

    List<CoverLetterHistory> findByUserIdOrderByCreatedAtDesc(Long userId);
}
