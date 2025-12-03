package com.we.hirehub.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Table(name = "token_package")
public class TokenPackage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable=false, length=50)
    private String name;

    @Column(nullable=false)
    private Integer tokenAmount;

    @Column(nullable=false)
    private Integer price;

    @Column(nullable=false)
    private Boolean active = true;
}
