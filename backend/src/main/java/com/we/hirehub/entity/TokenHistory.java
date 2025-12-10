package com.we.hirehub.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "token_history")
@Getter
@Setter
@NoArgsConstructor
public class TokenHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private Users user;

    private Integer amount;

    private String feature;

    private String description;

    @CreationTimestamp
    private LocalDateTime createdAt;

    @Builder
    public TokenHistory(Users user, Integer amount, String feature, String description) {
        this.user = user;
        this.amount = amount;
        this.feature = feature;
        this.description = description;
    }
}
