package com.we.hirehub.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Table(name = "month_salary")
public class MonthSalary {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // 월
    @Column(nullable = false)
    private String month;

    // 월별 평균 급여
    @Column(nullable = false)
    private String salary;
}
