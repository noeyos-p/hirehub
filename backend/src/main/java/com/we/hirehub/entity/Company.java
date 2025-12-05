package com.we.hirehub.entity;

import jakarta.persistence.*;
import lombok.*;

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
    private Integer since;

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

    // 직원수
    @Column(name = "count")
    private String count;

    // 기업 유형 (기업 구분)
    @Column(name = "company_type")
    private String companyType;

    // 위도 경도
    @Column(name = "lat")
    private Double lat;

    @Column(name = "lng")
    private Double lng;
}
