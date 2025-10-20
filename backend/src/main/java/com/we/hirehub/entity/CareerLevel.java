package com.we.hirehub.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDate;

/** 완료 */

@Entity
@Data
@Table(name = "career_level")
public class CareerLevel {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // 회사 이름
    @Column(length = 255, nullable = false, name = "company_name")
    private String companyName;

    // 재직형태
    @Column(length = 255)
    private String type;

    // 직급/직책
    @Column(length = 255)
    private String position;

    // 만든 날짜
    @Column(name = "start_at")
    private LocalDate startAt;

    // 수정 날짜
    @Column(name = "end_at")
    private LocalDate endAt;

    // 업무내용
    @Column(columnDefinition = "LONGTEXT")
    private String content;

    @ManyToOne
    @JoinColumn(name = "resume_id")
    private Resume resume;
}
