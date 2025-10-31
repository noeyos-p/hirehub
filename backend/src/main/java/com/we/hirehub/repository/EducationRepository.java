package com.we.hirehub.repository;

import com.we.hirehub.entity.Education;
import jakarta.transaction.Transactional;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface EducationRepository extends JpaRepository<Education, Long> {
    List<Education>   findByResumeId(Long resumeId);
    void deleteByResumeId(Long resumeId);
}