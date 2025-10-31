package com.we.hirehub.repository;

import com.we.hirehub.entity.FavoriteCompany;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface FavoriteCompanyRepository extends JpaRepository<FavoriteCompany, Long> {

    // 마이페이지 목록
    Page<FavoriteCompany> findByUsers_Id(Long userId, Pageable pageable);

    // 중복 체크 / 단건 조회
    Optional<FavoriteCompany> findByUsers_IdAndCompany_Id(Long userId, Long companyId);

    // 삭제
    void deleteByUsers_IdAndCompany_Id(Long userId, Long companyId);
}
