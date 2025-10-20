package com.we.hirehub.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDate;

/** 완료 */

@Entity
@Data
@Table(name = "apply")
public class Apply {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "resume_id")
    private Resume resume;

    @ManyToOne
    @JoinColumn(name = "jp_id")
    private JobPosts jobPosts;

    // 지원한 날짜 표시
    @Column(name = "apply_at")
    private LocalDate applyAt;
}
