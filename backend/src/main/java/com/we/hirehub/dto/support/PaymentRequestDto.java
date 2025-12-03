package com.we.hirehub.dto.support;

import lombok.Data;

@Data
public class PaymentRequestDto {

    private String type; // READY, APPROVE, FAIL, CANCEL

    private Long tokenPackageId;

    private Integer amount;
    private String goodName;

    private String tid;
    private String authToken;

    private String orderNumber;

    private String failReason;
    private String cancelReason;
}
