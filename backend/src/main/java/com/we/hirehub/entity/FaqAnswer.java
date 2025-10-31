package com.we.hirehub.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/** 완료 */

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Table(name = "faq_answer")
public class FaqAnswer {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "faq_question_id", nullable = false)
    private FaqQuestion faqQuestion;

    @Column(columnDefinition = "LONGTEXT", nullable = false)
    private String content;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "users_id")
    private Users users;

    @Column(name = "create_at", nullable = false)
    private LocalDateTime createAt;

    @Column(name = "update_at")
    private LocalDateTime updateAt;

}
