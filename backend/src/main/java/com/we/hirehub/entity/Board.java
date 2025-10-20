package com.we.hirehub.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;

/** 완료 */

@Entity
@Data
@Table(name = "board")
public class Board {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // 게시글 제목
    @Column(length = 255, nullable = false)
    private String title;

    // 게시글 내용
    @Column(columnDefinition = "LONGTEXT", nullable = false)
    private String content;

    @ManyToOne
    @JoinColumn(name = "users_id")
    private Users users;

    // 게시글 작성한 날짜 및 시간 표시
    @Column(name = "create_at")
    private LocalDateTime createAt;

    // 게시글 수정한 날짜 및 시간 표시
    @Column(name = "update_at")
    private LocalDateTime updateAt;
}
