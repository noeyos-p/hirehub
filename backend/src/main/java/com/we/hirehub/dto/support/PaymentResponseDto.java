package com.we.hirehub.dto.support;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class PaymentResponseDto {

    private String status;        // COMPLETED, FAILED
    private String message;       // 요약 메시지
    private String tid;           // PortOne imp_uid
    private String orderNumber;   // merchant_uid
}
