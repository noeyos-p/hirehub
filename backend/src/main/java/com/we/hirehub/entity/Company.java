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
@Table(name = "company")
public class Company {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // 회사 이름
    @Column(nullable = false)
    private String name;

    // 회사 소개
    @Column(columnDefinition = "LONGTEXT", nullable = false)
    private String content;

    // 주소
    @Column(nullable = false)
    private String address;

    // 설립년도
    @Column(nullable = false)
    private LocalDate since;

    // 복리후생
    @Column(nullable = false)
    private String benefits;

    // 홈페이지
    @Column(nullable = false)
    private String website;

    // 업종
    @Column(nullable = false)
    private String industry;

    // 대표자명
    @Column(nullable = false)
    private String ceo;

    // 기업사진
    @Column(columnDefinition = "LONGTEXT") // 사용이유 : AWS S3 url 사용
    private String photo;
}
