package com.we.hirehub.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Table(name = "avg_salary")
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
}
