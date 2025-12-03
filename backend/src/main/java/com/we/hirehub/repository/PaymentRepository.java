package com.we.hirehub.repository;

import com.we.hirehub.entity.Payment;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface PaymentRepository extends JpaRepository<Payment, Long> {

    Optional<Payment> findByOrderNumber(String orderNumber);
    Optional<Payment> findByTid(String tid);
}
