package com.we.hirehub.repository;

import com.we.hirehub.entity.CareerLevel;
import jakarta.transaction.Transactional;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CareerLevelRepository extends JpaRepository<CareerLevel, Long> {
    List<CareerLevel> findByResumeId(Long resumeId);
    void deleteByResumeId(Long resumeId);
}