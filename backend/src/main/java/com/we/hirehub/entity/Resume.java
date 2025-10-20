package com.we.hirehub.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDate;

/** 완료 */

@Entity
@Data
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

    @ManyToOne
    @JoinColumn(name = "education_id")
    private Education education;

    @Column(length = 255, name = "career_level_id")
    private CareerLevel careerLevel;

    // 자격증
    @Column(length = 255)
    private String certificate;

    // 언어
    @Column(length = 255)
    private String language;

    // 기술
    @Column(length = 255)
    private String skill;

    // 자기소개서 제목
    @Column(length = 255, name = "essay_title")
    private String essayTittle;

    // 자기소개서 내용
    @Column(columnDefinition = "LONGTEXT", name = "essay_content")
    private String essayContent;

    @ManyToOne
    @JoinColumn(name = "users_id")
    private Users users;

    // 만든 날짜
    @Column(name = "create_at")
    private LocalDate createAt;

    // 수정 날짜
    @Column(name = "update_at")
    private LocalDate updateAt;

    // 지원완료 된 이력서 여부
    private boolean locked;
}
