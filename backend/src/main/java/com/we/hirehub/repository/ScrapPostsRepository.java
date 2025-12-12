package com.we.hirehub.repository;

import com.we.hirehub.entity.ScrapPosts;
import org.springframework.data.domain.Page;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.Pageable;

import java.util.Optional;

public interface ScrapPostsRepository extends JpaRepository<ScrapPosts, Long> {
    boolean existsByUsersIdAndJobPostsId(Long userId, Long jobPostId);
    Optional<ScrapPosts> findByUsersIdAndJobPostsId(Long userId, Long jobPostId);
    Page<ScrapPosts> findByUsersId(Long userId, Pageable pageable);
    void deleteByJobPosts_Id(Long jobPostId);
}
