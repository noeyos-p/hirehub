package com.we.hirehub.repository;

import com.we.hirehub.entity.Review;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ReviewRepository extends JpaRepository<Review, Long> {

    /** ✅ 모든 리뷰 페이징 조회 */
    Page<Review> findAll(Pageable pageable);

    /** ✅ 특정 회사 리뷰 전체 조회 (페이징 X) */
    List<Review> findByCompanyId(Long companyId);

    /** ✅ 특정 회사 리뷰 페이징 조회 (최신순 정렬) */
    @Query("SELECT r FROM Review r WHERE r.company.id = :companyId ORDER BY r.id DESC")
    Page<Review> findByCompanyId(@Param("companyId") Long companyId, Pageable pageable);

    /** ✅ 특정 회사 평균 별점 계산 */
    @Query("SELECT AVG(r.score) FROM Review r WHERE r.company.id = :companyId")
    Double findAverageScoreByCompanyId(@Param("companyId") Long companyId);
}
