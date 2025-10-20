package com.we.hirehub.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDate;

/** 완료 */

@Entity
@Data
@Table(name = "education")
public class Education {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // 학교 이름
    @Column(length = 255, nullable = false)
    private String name;

    // 전공
    @Column(length = 255)
    private String major;

    // 졸업상태
    @Column(length = 255)
    private String status;

    // 재직형태
    @Column(length = 255)
    private String type;

    // 입학일
    @Column(name = "start_at")
    private LocalDate startAt;

    // 졸업일
    @Column(name = "end_at")
    private LocalDate endAt;

    @ManyToOne
    @JoinColumn(name = "resume_id")
    private Resume resume;

}
