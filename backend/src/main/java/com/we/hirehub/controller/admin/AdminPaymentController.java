package com.we.hirehub.controller.admin;

import com.we.hirehub.dto.support.PaymentDto;
import com.we.hirehub.service.support.PaymentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/payments")
@RequiredArgsConstructor
public class AdminPaymentController {

    private final PaymentService paymentService;

    /** ✔ 전체 결제 조회 */
    @GetMapping
    public ResponseEntity<List<PaymentDto>> getAllPayments() {
        return ResponseEntity.ok(paymentService.getAllPayments());
    }

    /** ✔ 검색 */
    @GetMapping("/search")
    public ResponseEntity<List<PaymentDto>> search(
            @RequestParam(required = false) String email,
            @RequestParam(required = false) String status
    ) {
        return ResponseEntity.ok(paymentService.searchPayments(email, status));
    }
}
