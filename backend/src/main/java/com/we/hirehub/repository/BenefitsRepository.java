package com.we.hirehub.repository;

import com.we.hirehub.entity.Benefits;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface BenefitsRepository extends JpaRepository<Benefits, Long> {
    List<Benefits> findByCompanyId(Long companyId);

    @Modifying
    @Query("DELETE FROM Benefits b WHERE b.company.id = :companyId")
    void deleteByCompanyId(@Param("companyId") Long companyId);
}
