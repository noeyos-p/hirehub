package com.we.hirehub.dto.user;

import com.we.hirehub.entity.Payment;
import com.we.hirehub.entity.TokenPackage;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class PaymentDetailDto {

    private Long id;

    private Long userId;
    private Long tokenPackageId;

    private String orderNumber;
    private String tid;
    private String mid;

    private Integer totalPrice;
    private String goodName;

    private String resultCode;
    private String resultMsg;
    private String applNum;

    private LocalDateTime applDate;

    private String role;
    private String refundReason;

    private LocalDateTime createAt;
    private LocalDateTime updateAt;


    /** 엔티티 -> DTO 변환 */
    public static PaymentDetailDto from(Payment payment) {

        TokenPackage tp = payment.getTokenPackage();

        return PaymentDetailDto.builder()
                .id(payment.getId())
                .userId(payment.getUser().getId())
                .tokenPackageId(tp != null ? tp.getId() : null)

                .orderNumber(payment.getOrderNumber())
                .tid(payment.getTid())
                .mid(payment.getMid())

                .totalPrice(payment.getTotalPrice())
                .goodName(payment.getGoodName())

                .resultCode(payment.getResultCode())
                .resultMsg(payment.getResultMsg())
                .applNum(payment.getApplNum())

                .applDate(payment.getApplDate())

                .role(payment.getRole())
                .refundReason(payment.getRefundReason())

                .createAt(payment.getCreateAt())
                .updateAt(payment.getUpdateAt())
                .build();
    }
}
