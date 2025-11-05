package com.we.hirehub.repository;

import com.we.hirehub.entity.Company;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface CompanyRepository extends JpaRepository<Company, Long> {
    // 페이징으로 모든 기업 조회
    Page<Company> findAll(Pageable pageable);
    // 기업명 또는 업종으로 검색
    @Query("SELECT c FROM Company c WHERE c.name LIKE %:keyword% OR c.industry LIKE %:keyword%")
    Page<Company> searchByKeyword(@Param("keyword") String keyword, Pageable pageable);
    // 필요 시 id으로 조회할 때 사용
    Optional<Company> findById(Long id);
}
