package com.we.hirehub.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

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

    // 마감일
    @Column(name = "end_at")
    private LocalDate endAt;

    // 위치
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

    // 공고사진
    @Column(columnDefinition = "LONGTEXT") // 사용이유 : AWS S3 url 사용
    private String photo;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "company_id", nullable = false)
    private Company company;

    @Builder.Default
    @Column(nullable = false)
    private Long views = 0L; // 조회수 기본값 0

    // 주요업무
    @Column(name = "main_job")
    private String mainJob;

    // 자격요건
    @Column(columnDefinition = "LONGTEXT")
    private String qualification;

    // 우대사항
    @Column(columnDefinition = "LONGTEXT")
    private String preference;

    // 채용전형
    @Column(name = "hire_type")
    private String hireType;

    // summary
    @Lob
    private String summary; // 3~5줄 요약 저장

    // 임베딩
    @Column(columnDefinition = "JSON")
    private String embedding; // JSON 문자열로 저장 (vector)

    //위도와 경도
    @Column(name = "lat")
    private Double lat;

    @Column(name = "lng")
    private Double lng;

    @OneToMany(mappedBy = "jobPost", fetch = FetchType.LAZY)
    private java.util.List<TechStack> techStacks;
}
