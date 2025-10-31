package com.we.hirehub.repository;

import com.we.hirehub.entity.Apply;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ApplyRepository extends JpaRepository<Apply, Long> {

    // 이미 있던 메서드: 내 지원내역 조회
    List<Apply> findByResume_Users_Id(Long userId);

    // ✅ 신규: 같은 이력서 + 같은 공고 중복지원 방지
    Optional<Apply> findByResume_IdAndJobPosts_Id(Long resumeId, Long jobPostsId);
}
