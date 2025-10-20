package com.we.hirehub.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDate;

/** 완료 */

@Entity
@Data
@Table(name = "job_posts")
public class JobPosts {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // 게시글 제목
    @Column(length = 255, nullable = false)
    private String title;

    // 게시글 내용
    @Column(columnDefinition = "LONGTEXT", nullable = false)
    private String content;

    // 시작일
    @Column(name = "start_at")
    private LocalDate startAt;

    // 마감일
    @Column(name = "end_at")
    private LocalDate endAt;

    @Column(length = 255)
    private String location;

    @Column(length = 255, name = "career_level")
    private String careerLevel;

    @Column(length = 255)
    private String education;

    @ManyToOne
    @JoinColumn(name = "company_id")
    private Company company;
}
