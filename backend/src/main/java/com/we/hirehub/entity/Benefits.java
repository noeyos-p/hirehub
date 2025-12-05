package com.we.hirehub.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Table(name = "benefits")
public class Benefits {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;   // 예: 4대보험, 퇴직금, 연차, 워크샵, 자기계발비 등

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "company_id")

    private Company company;
}
