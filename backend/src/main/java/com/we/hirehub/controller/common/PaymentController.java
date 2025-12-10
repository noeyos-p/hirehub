package com.we.hirehub.controller.common;

import com.we.hirehub.dto.support.PaymentDto;
import com.we.hirehub.dto.support.VerifyRequest;
import com.we.hirehub.entity.Payment;
import com.we.hirehub.entity.Users;
import com.we.hirehub.service.support.PaymentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;


import java.util.List;

@RestController
@RequestMapping("/api/payment")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;

    /** PortOne 결제 검증 */
    @PostMapping("/verify")
    public ResponseEntity<?> verify(@RequestBody VerifyRequest req) {
        return ResponseEntity.ok(paymentService.verify(req));
    }

    /** 유저 결제 내역 조회 */
    @GetMapping("/my")
    public List<PaymentDto> getMyPayments() {
        return paymentService.getMyPayments();
    }
}
