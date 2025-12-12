package com.we.hirehub.repository;

import com.we.hirehub.entity.Payment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface PaymentRepository extends JpaRepository<Payment, Long> {

    Optional<Payment> findByOrderNumber(String orderNumber);
    Optional<Payment> findByTid(String tid);

    // 마이페이지용
    List<Payment> findAllByUserIdOrderByCreateAtDesc(Long userId);

    // 전체 조회
    List<Payment> findAllByOrderByCreateAtDesc();

    // ------------------------------------
    // 🔍 단일 조건 검색
    // ------------------------------------
    List<Payment> findAllByUserEmailContaining(String email);
    List<Payment> findAllByRole(String role);

    // 날짜 단일 조건
    List<Payment> findAllByCreateAtBetween(LocalDateTime from, LocalDateTime to);

    // ------------------------------------
    // 🔍 2조건 검색
    // ------------------------------------
    List<Payment> findAllByUserEmailContainingAndRole(String email, String role);

    List<Payment> findAllByUserEmailContainingAndCreateAtBetween(
            String email,
            LocalDateTime from,
            LocalDateTime to
    );

    List<Payment> findAllByRoleAndCreateAtBetween(
            String role,
            LocalDateTime from,
            LocalDateTime to
    );

    // ------------------------------------
    // 🔍 3조건 검색 (email + status + date)
    // ------------------------------------
    List<Payment> findAllByUserEmailContainingAndRoleAndCreateAtBetween(
            String email,
            String role,
            LocalDateTime from,
            LocalDateTime to
    );
}
