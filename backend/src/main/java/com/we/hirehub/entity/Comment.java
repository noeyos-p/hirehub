package com.we.hirehub.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

/** 완료 */

@Entity
@Data
@Table(name = "comment")
public class Comment {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // 댓글
    @Column(columnDefinition = "LONGTEXT", nullable = false)
    private String content;

    @ManyToOne
    @JoinColumn(name = "users_id")
    private Users users;

    @ManyToOne
    @JoinColumn(name = "board_id")
    private Board board;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "comment_id")
    private Comment parentComment;

    // 댓글 작성한 날짜 및 시간 표시
    @Column(name = "create_at")
    private LocalDateTime createAt;

    // 댓글 수정한 날짜 및 시간 표시
    @Column(name = "update_at")
    private LocalDateTime updateAt;
}
