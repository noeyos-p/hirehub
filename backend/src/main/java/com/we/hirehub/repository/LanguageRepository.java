package com.we.hirehub.repository;

import com.we.hirehub.entity.Language;
import jakarta.transaction.Transactional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface LanguageRepository extends JpaRepository<Language, Long> {
    List<Language>    findByResumeId(Long resumeId);
    void deleteByResumeId(Long resumeId);
}