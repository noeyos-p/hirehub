package com.we.hirehub.dto.support;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class PaymentResponseDto {

    private String status;     // PENDING, SUCCESS, FAILED, CANCELLED
    private String message;

    private String tid;
    private String payUrl;
    private String orderNumber;

    private String applNum;
    private String applDate;
}
