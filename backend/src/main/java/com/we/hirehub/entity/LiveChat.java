package com.we.hirehub.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

@Entity
@Data
@Table(name = "live_chat")
public class LiveChat {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // 게시글 내용
    @Column(columnDefinition = "LONGTEXT", nullable = false)
    private String content;

    @Column(name = "create_at")
    private LocalDateTime createAt;

    @ManyToOne
    @JoinColumn(name = "session_id")
    private Session session;




}
