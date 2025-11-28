package com.we.hirehub.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Table(name = "agreement")
public class Agreement {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // 일반 약관 제목
    @Column(length = 255)
    private String title;

    // 일반 약관 내용
    @Column(columnDefinition = "LONGTEXT")
    private String content;

    // 프리미엄 약관 제목
    @Column(name = "premium_title", length = 255)
    private String premiumTitle;

    // 프리미엄 약관 내용
    @Column(name = "premium_content", columnDefinition = "LONGTEXT")
    private String premiumContent;
}
