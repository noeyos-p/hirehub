package com.we.hirehub.dto.user;

import com.we.hirehub.entity.Payment;
import com.we.hirehub.entity.Premium;
import com.we.hirehub.entity.Users;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PaymentDto {

    private Long id;
    private String orderNumber;
    private Long premiumId;
    private Long userId;
    private String tid;
    private String mid;
    private Integer totalPrice;
    private String goodName;
    private String payMethod;
    private String authToken;
    private String resultCode;
    private String resultMsg;
    private String applNum;
    private LocalDateTime applDate;
    private String role;
    private String refundReason;
    private LocalDateTime createAt;
    private LocalDateTime updateAt;
    private String userName;
    private String userEmail;

    /** Entity -> Dto **/
    public static PaymentDto toDto(Payment payment) {
        return PaymentDto.builder()
                .id(payment.getId())
                .orderNumber(payment.getOrderNumber())
                .premiumId(payment.getPremium() != null ? payment.getPremium().getId() : null)
                .userId(payment.getUser().getId())
                .tid(payment.getTid())
                .mid(payment.getMid())
                .totalPrice(payment.getTotalPrice())
                .goodName(payment.getGoodName())
                .payMethod(payment.getPayMethod())
                .authToken(payment.getAuthToken())
                .resultCode(payment.getResultCode())
                .resultMsg(payment.getResultMsg())
                .applNum(payment.getApplNum())
                .applDate(payment.getApplDate())
                .role(payment.getRole())
                .refundReason(payment.getRefundReason())
                .createAt(payment.getCreateAt())
                .updateAt(payment.getUpdateAt())
                .userName(payment.getUser().getName())
                .userEmail(payment.getUser().getEmail())
                .build();
    }

    /** Dto -> Entity **/
    public Payment toEntity(Users user, Premium premium) {
        return Payment.builder()
                .id(this.id)
                .orderNumber(this.orderNumber)
                .premium(premium)
                .user(user)
                .tid(this.tid)
                .mid(this.mid)
                .totalPrice(this.totalPrice)
                .goodName(this.goodName)
                .payMethod(this.payMethod)
                .authToken(this.authToken)
                .resultCode(this.resultCode)
                .resultMsg(this.resultMsg)
                .applNum(this.applNum)
                .applDate(this.applDate)
                .role(this.role)
                .refundReason(this.refundReason)
                .createAt(this.createAt != null ? this.createAt : LocalDateTime.now())
                .updateAt(this.updateAt)
                .build();
    }

    /** 기존 Entity 업데이트 **/
    public void updateEntity(Payment payment) {
        if (this.tid != null) {
            payment.setTid(this.tid);
        }
        if (this.resultCode != null) {
            payment.setResultCode(this.resultCode);
        }
        if (this.resultMsg != null) {
            payment.setResultMsg(this.resultMsg);
        }
        if (this.applNum != null) {
            payment.setApplNum(this.applNum);
        }
        if (this.applDate != null) {
            payment.setApplDate(this.applDate);
        }
        if (this.role != null) {
            payment.setRole(this.role);
        }
        if (this.refundReason != null) {
            payment.setRefundReason(this.refundReason);
        }
        payment.setUpdateAt(LocalDateTime.now());
    }
}
