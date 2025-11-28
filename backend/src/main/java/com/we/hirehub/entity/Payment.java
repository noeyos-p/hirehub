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

    // 주문번호 (임시, 나중에 삭제 가능)
    @Column(name = "order_number", unique = true, length = 40)
    private String orderNumber;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "premium_id")
    private Premium premium;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private Users user;

    // 이니시스 거래번호
    @Column(length = 40)
    private String tid;

    // 상점아이디
    @Column(length = 10)
    private String mid;

    // 결제 금액
    @Column(name = "total_price")
    private Integer totalPrice;

    // 상품명: "프리미엄 구독"
    @Column(name = "good_name", length = 40)
    private String goodName;

    // 지불수단: 카카오페이, 네이버페이 등
    @Column(name = "pay_method", length = 10)
    private String payMethod;

    // 승인요청 검증토큰
    @Column(name = "auth_token", columnDefinition = "TEXT")
    private String authToken;

    // 결과코드
    @Column(name = "result_code", length = 10)
    private String resultCode;

    // 결과메시지
    @Column(name = "result_msg", length = 100)
    private String resultMsg;

    // 승인번호
    @Column(name = "appl_num", length = 8)
    private String applNum;

    // 승인일시
    @Column(name = "appl_date")
    private LocalDateTime applDate;

    // 결제 상태 (PENDING, COMPLETED, CANCELLED, FAILED)
    @Column(length = 20, nullable = false)
    private String role;

    // 환불 사유
    @Column(name = "refund_reason", length = 500)
    private String refundReason;

    // 생성일시
    @Column(name = "create_at", nullable = false)
    private LocalDateTime createAt;

    // 수정일시
    @Column(name = "update_at")
    private LocalDateTime updateAt;
}
