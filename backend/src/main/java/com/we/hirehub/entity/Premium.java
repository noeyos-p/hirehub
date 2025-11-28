package com.we.hirehub.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Table(name = "premium")
public class Premium {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private Users user;

    // 구독 시작일
    @Column(name = "start_at", nullable = false)
    private LocalDate startAt;

    // 구독 종료일
    @Column(name = "end_at", nullable = false)
    private LocalDate endAt;

    // 구독 상태 (ACTIVE, EXPIRED, CANCELLED)
    @Column(length = 20, nullable = false)
    private String role;
}
