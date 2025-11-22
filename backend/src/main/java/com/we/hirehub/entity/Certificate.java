package com.we.hirehub.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Table(name = "certificate")
public class Certificate {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // 자격증명
    @Column(nullable = false)
    private String name;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "resume_id")
    private Resume resume;

    // ⭐ 생성 메서드
    @Builder
    public Certificate(String name, Resume resume) {
        this.name = name;
        this.resume = resume;
    }

    // ⭐ 수정 메서드 (필요 시)
    public void updateName(String name) {
        this.name = name;
    }
}
