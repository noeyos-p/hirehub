package com.we.hirehub.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "avg_salary")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AvgSalary {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // 연도
    @Column(nullable = false)
    private String year;

    // 평균 연봉
    @Column(nullable = false)
    private String salary;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "company_id", nullable = false)
    private Company company;
}
