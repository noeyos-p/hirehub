package com.we.hirehub.repository;

import com.we.hirehub.entity.TokenPackage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TokenPackageRepository extends JpaRepository<TokenPackage, Long> {
    List<TokenPackage> findAllByActiveTrue();
}