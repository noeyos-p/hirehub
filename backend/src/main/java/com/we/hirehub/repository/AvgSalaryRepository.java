package com.we.hirehub.repository;

import com.we.hirehub.entity.AvgSalary;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AvgSalaryRepository extends JpaRepository<AvgSalary, Long> {
    List<AvgSalary> findByCompanyIdOrderByYearAsc(Long companyId);
}
