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
@Table(name = "education")
public class Education {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // 학교 이름
    @Column(nullable = false)
    private String name;

    // 전공
    private String major;

    // 졸업상태
    @Column(nullable = false)
    private String status;

    // 고졸, 대졸
    @Column(nullable = false)
    private String type;

    // 입학일
    @Column(name = "start_at", nullable = false)
    private LocalDate startAt;

    // 졸업일
    @Column(name = "end_at")
    private LocalDate endAt;

    @ManyToOne
    @JoinColumn(name = "resume_id", nullable = false)
    private Resume resume;

}
