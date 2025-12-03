package com.we.hirehub.controller.common;

import com.we.hirehub.dto.support.InicisResponseDto;
import com.we.hirehub.dto.support.PaymentRequestDto;
import com.we.hirehub.service.support.PaymentService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/pay")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;

    @PostMapping("/ready")
    public InicisResponseDto ready(@RequestBody PaymentRequestDto req) {
        return paymentService.ready(req);
    }

    @PostMapping("/approve")
    public InicisResponseDto approve(@RequestBody PaymentRequestDto req) {
        return paymentService.approve(req);
    }

    @PostMapping("/cancel")
    public InicisResponseDto cancel(@RequestBody PaymentRequestDto req) {
        return paymentService.cancel(req);
    }
}
