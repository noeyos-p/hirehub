package com.we.hirehub.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Table(name = "ai_board_control")
public class AiBoardControl {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "board_id", nullable = false)
    private Board board;

    // 관리자가 승인/삭제 했는지 추적
    @Column(length = 20)
    private String role; // BOT or ADMIN

    // 이유/사유
    @Column(columnDefinition = "TEXT")
    private String reason;
}
