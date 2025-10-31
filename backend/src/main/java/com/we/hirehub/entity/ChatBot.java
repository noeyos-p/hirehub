package com.we.hirehub.entity;

import com.vladmihalcea.hibernate.type.json.JsonType;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.Type;

import java.time.LocalDate;
import java.util.Map;

/** 완료 */

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Table(name = "chat_bot")
public class ChatBot {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "users_id", nullable = false)
    private Users users;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "session_id", nullable = false)
    private Session session;

    @Column(columnDefinition = "LONGTEXT")
    private String content;

    @Column(columnDefinition = "LONGTEXT", name = "bot_answer")
    private String botAnswer;

    private boolean onoff;

    @Type(JsonType.class)
    @Column(columnDefinition = "json")
    private Map<String, Object> meta;

    @Column(name = "create_at")
    private LocalDate createAt;

}
