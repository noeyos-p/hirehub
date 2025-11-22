package com.we.hirehub.entity;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/** FAQ 질문/답변 엔티티 */

@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Table(name = "faq_question")
public class FaqQuestion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "LONGTEXT", nullable = false)
    private String content;

    private String category;

    private String tags;

    @Column(name = "create_at", nullable = false)
    private LocalDateTime createAt;

    @Column(name = "update_at")
    private LocalDateTime updateAt;

    /** 생성자 (Builder) */
    @Builder
    private FaqQuestion(String title, String content, String category, String tags, LocalDateTime createAt) {
        this.title = title;
        this.content = content;
        this.category = category;
        this.tags = tags;
        this.createAt = createAt;
        this.updateAt = null;
    }

    /** 정적 생성 메서드 */
    public static FaqQuestion create(String title, String content, String category, String tags) {
        return FaqQuestion.builder()
                .title(title)
                .content(content)
                .category(category)
                .tags(tags)
                .createAt(LocalDateTime.now())
                .build();
    }

    /** 수정 메서드 */
    public void update(String title, String content, String category, String tags) {
        this.title = title;
        this.content = content;
        this.category = category;
        this.tags = tags;
        this.updateAt = LocalDateTime.now();
    }
}
