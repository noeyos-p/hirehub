package com.we.hirehub.repository;

import com.we.hirehub.entity.TechStack;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface TechStackRepository extends JpaRepository<TechStack, Long> {
    List<TechStack> findByJobPostId(Long jobPostId);

    @Modifying
    @Query("DELETE FROM TechStack t WHERE t.jobPost.id = :jobPostId")
    void deleteByJobPostId(@Param("jobPostId") Long jobPostId);
}
