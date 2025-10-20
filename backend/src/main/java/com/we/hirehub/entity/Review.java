package com.we.hirehub.entity;

import jakarta.persistence.*;
import lombok.Data;

/** 완료 */

@Entity
@Data
@Table(name = "review")
public class Review {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long score;

    @Column(length = 255)
    private String content;

    @ManyToOne
    @JoinColumn(name = "users_id")
    private Users users;
}
