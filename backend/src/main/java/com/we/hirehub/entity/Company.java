package com.we.hirehub.entity;

import jakarta.persistence.*;
import lombok.Data;

/** 완료 */

@Entity
@Data
@Table(name = "company")
public class Company {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // 회사 이름
    @Column(length = 255, nullable = false)
    private String name;

    // 회사 소개
    @Column(columnDefinition = "LONGTEXT", nullable = false)
    private String content;

    // 주소
    @Column(length = 255)
    private String address;

    // 설립년도
    private Long since;

    // 복리후생
    @Column(length = 255)
    private String benefits;

    // 홈페이지
    @Column(length = 255)
    private String website;

    // 업종
    @Column(length = 255)
    private String industry;

    // 대표자명
    @Column(length = 255)
    private String ceo;

    // 기업사진
    @Column(columnDefinition = "LONGTEXT") // 사용이유 : AWS S3 url 사용
    private String photo;


}
