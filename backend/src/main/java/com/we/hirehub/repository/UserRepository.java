package com.we.hirehub.repository;

import com.we.hirehub.entity.Users;
import org.springframework.data.jpa.repository.JpaRepository;

// 호환성을 위해 이름만 UserRepository로 유지
public interface UserRepository extends JpaRepository<Users, Long> {
}
