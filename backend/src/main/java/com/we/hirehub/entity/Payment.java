package com.we.hirehub.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Table(name = "payment")
public class Payment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, length = 40)
    private String orderNumber;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private Users user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "token_package_id")
    private TokenPackage tokenPackage;

    private String tid;     // 이니시스 tid
    private String mid;     // 상점 아이디
    private Integer totalPrice;
    private String goodName;

    private String resultCode;
    private String resultMsg;

    private String applNum;
    private LocalDateTime applDate;

    private String role;           // PENDING, COMPLETED, FAILED, CANCELLED
    private String refundReason;

    private LocalDateTime createAt;
    private LocalDateTime updateAt;

    @Column(nullable = false)
    private String status;   // READY, PAID, CANCEL, FAIL 등

    @Column(length = 20)
    private String payMethod;   // KAKAOPAY, CARD 등

}
