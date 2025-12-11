package com.we.hirehub.repository;

import com.we.hirehub.entity.Coach;
import com.we.hirehub.entity.Users;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CoachRepository extends JpaRepository<Coach, Long> {
    List<Coach> findByUserOrderByIdDesc(Users user);
    List<Coach> findByUserOrderByIdAsc(Users user);
}
