package com.we.hirehub.repository;

import com.we.hirehub.entity.Certificate;
import jakarta.transaction.Transactional;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CertificateRepository extends JpaRepository<Certificate, Long> {
    List<Certificate> findByResumeId(Long resumeId);
    void deleteByResumeId(Long resumeId);
}