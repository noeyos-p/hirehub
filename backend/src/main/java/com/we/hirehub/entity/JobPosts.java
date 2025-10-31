package com.we.hirehub.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

/** 완료 */

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Table(name = "job_posts")
public class JobPosts {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // 공고 제목
    @Column(length = 255, nullable = false)
    private String title;

    // 공고 내용
    @Column(columnDefinition = "LONGTEXT", nullable = false)
    private String content;

    // 시작일
    @Column(name = "start_at", nullable = false)
    private LocalDate startAt;

    // 마감일
    @Column(name = "end_at", nullable = false)
    private LocalDate endAt;

    // 선호하는 지역
    @Column(nullable = false)
    private String location;

    // 경력
    @Column(name = "career_level", nullable = false)
    private String careerLevel;

    // 학력
    @Column(nullable = false)
    private String education;

    // 직무
    @Column(nullable = false)
    private String position;

    // 고용형태
    @Column(nullable = false)
    private String type;

    // 급여
    @Column(nullable = false)
    private String salary;

    // 공고사진
    @Column(columnDefinition = "LONGTEXT") // 사용이유 : AWS S3 url 사용
    private String photo;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "company_id", nullable = false)
    private Company company;

    @Column(nullable = false)
    private Integer views = 0; // 조회수 기본값 0

}
