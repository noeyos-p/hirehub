package com.we.hirehub.repository;

import com.we.hirehub.entity.Resume;
import com.we.hirehub.entity.Users;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ResumeRepository extends JpaRepository<Resume, Long> {
    Page<Resume> findByUsers_Id(Long userId, Pageable pageable);
    Optional<Resume> findByIdAndUsers_Id(Long resumeId, Long userId);

    // ✅ 추가
    List<Resume> findByUsers(Users users);

    // 잠금 여부 확인용 (선택)
    boolean existsByIdAndLockedTrue(Long resumeId);
    boolean existsByIdAndUsers_IdAndLockedTrue(Long resumeId, Long userId);
}
