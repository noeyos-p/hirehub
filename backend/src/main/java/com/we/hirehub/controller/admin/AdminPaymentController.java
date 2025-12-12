package com.we.hirehub.controller.admin;

import com.we.hirehub.dto.support.PaymentDto;
import com.we.hirehub.service.support.PaymentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
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

    /** ✔ 이메일 / 닉네임 / 상태 검색 */
    @GetMapping("/search")
    public ResponseEntity<List<PaymentDto>> search(
            @RequestParam(required = false) String email,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String dateFrom,
            @RequestParam(required = false) String dateTo
    ) {
        LocalDate from = (dateFrom != null && !dateFrom.isBlank()) ? LocalDate.parse(dateFrom) : null;
        LocalDate to = (dateTo != null && !dateTo.isBlank()) ? LocalDate.parse(dateTo) : null;

        return ResponseEntity.ok(paymentService.searchPayments(email, status, from, to));
    }
}
