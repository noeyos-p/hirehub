package com.we.hirehub.repository;

import com.we.hirehub.entity.TotalSales;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TotalSalesRepository extends JpaRepository<TotalSales, Long> {
    List<TotalSales> findByCompanyIdOrderByYearAsc(Long companyId);
}
