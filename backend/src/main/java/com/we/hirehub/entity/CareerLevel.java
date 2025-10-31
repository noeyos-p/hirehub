package com.we.hirehub.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.util.List;

/** 완료 */

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Table(name = "career_level")
public class CareerLevel {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // 회사 이름
    @Column(length = 255, nullable = false, name = "company_name")
    private String companyName;

    // 재직형태
    @Column(nullable = false)
    private String type;

    // 직급/직책
    @Column(nullable = false)
    private String position;

    // 만든 날짜
    @Column(name = "start_at", nullable = false)
    private LocalDate startAt;

    // 수정 날짜
    @Column(name = "end_at")
    private LocalDate endAt;

    // 업무내용
    @Column(columnDefinition = "LONGTEXT", nullable = false)
    private String content;

    @ManyToOne
    @JoinColumn(name = "resume_id")
    private Resume resume;
}
