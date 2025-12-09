package com.we.hirehub.dto.support;

import com.we.hirehub.entity.Payment;
import lombok.Builder;
import lombok.Getter;
import software.amazon.awssdk.annotations.NotNull;

import java.time.format.DateTimeFormatter;

@Getter
@Builder
public class PaymentDto {

    private Long id;
    private String goodName;
    private Integer amount;
    private String status;
    private String createdAt;
    private String payMethod;
    private Integer tokenAmount;
    private String userEmail;

    public static PaymentDto from(@NotNull Payment p) {
        return PaymentDto.builder()
                .id(p.getId())
                .goodName(p.getGoodName())
                .amount(p.getTotalPrice())
                .status(p.getStatus())
                .createdAt(
                        p.getCreateAt() != null
                                ? p.getCreateAt().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm"))
                                : null
                )
                .payMethod(p.getPayMethod())
                .tokenAmount(
                        p.getTokenPackage() != null
                                ? p.getTokenPackage().getTokenAmount()
                                : null
                )
                .userEmail(p.getUser() != null ? p.getUser().getEmail() : null)
                .build();
    }
}
