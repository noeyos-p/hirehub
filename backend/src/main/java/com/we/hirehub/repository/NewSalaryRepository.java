package com.we.hirehub.repository;

import com.we.hirehub.entity.NewSalary;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NewSalaryRepository extends JpaRepository<NewSalary, Long> {
    List<NewSalary> findByCompanyIdOrderByYearAsc(Long companyId);
}
