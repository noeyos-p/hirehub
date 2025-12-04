package com.we.hirehub.repository;

import com.we.hirehub.entity.AgeAverage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AgeAverageRepository extends JpaRepository<AgeAverage, Long> {
    List<AgeAverage> findByCompanyId(Long companyId);
}
