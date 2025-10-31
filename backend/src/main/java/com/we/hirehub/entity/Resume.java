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
@Table(name = "resume")
public class Resume {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // 이력서 제목
    @Column(length = 255, nullable = false)
    private String title;

    // 증명사진
    @Column(columnDefinition = "LONGTEXT", name = "id_photo") // 사용이유 : AWS S3 url 사용
    private String idPhoto;

    // 자기소개서 제목
    @Column(length = 255, name = "essay_title")
    private String essayTittle;

    // 자기소개서 내용
    @Column(columnDefinition = "LONGTEXT", name = "essay_content")
    private String essayContent;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "users_id", nullable = false)
    private Users users;

    // 만든 날짜
    @Column(name = "create_at", nullable = false)
    private LocalDate createAt;

    // 수정 날짜
    @Column(name = "update_at")
    private LocalDate updateAt;

    // 지원완료 된 이력서 여부
    @Column(nullable = false)
    private boolean locked;

    @Column(columnDefinition = "LONGTEXT")
    private String htmlContent;
}
