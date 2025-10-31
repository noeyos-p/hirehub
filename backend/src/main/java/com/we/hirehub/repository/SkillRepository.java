package com.we.hirehub.repository;

import com.we.hirehub.entity.Skill;
import jakarta.transaction.Transactional;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SkillRepository extends JpaRepository<Skill, Long> {
    List<Skill>       findByResumeId(Long resumeId);
    void deleteByResumeId(Long resumeId);
}