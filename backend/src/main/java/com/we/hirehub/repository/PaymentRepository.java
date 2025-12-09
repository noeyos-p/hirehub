package com.we.hirehub.repository;

import com.we.hirehub.entity.Payment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PaymentRepository extends JpaRepository<Payment, Long> {

    Optional<Payment> findByOrderNumber(String orderNumber);
    Optional<Payment> findByTid(String tid);

    List<Payment> findAllByUserIdOrderByCreateAtDesc(Long userId);

    List<Payment> findAllByOrderByCreateAtDesc();

    List<Payment> findAllByUserEmailContaining(String email);
    List<Payment> findAllByRole(String role);
    List<Payment> findAllByUserEmailContainingAndRole(String email, String role);
}
