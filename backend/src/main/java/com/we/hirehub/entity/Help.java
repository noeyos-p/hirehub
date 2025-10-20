package com.we.hirehub.entity;

import com.vladmihalcea.hibernate.type.json.JsonType;
import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.Type;

import java.time.LocalDateTime;
import java.util.Map;

@Entity
@Data
@Table(name = "help")
public class Help {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "session_id")
    private Session session;

    // 요청
    @Column(name = "request_at")
    private LocalDateTime requestAt;

    // 수락
    @Column(name = "start_at")
    private LocalDateTime startAt;

    // 종료
    @Column(name = "end_at")
    private LocalDateTime endAt;

    @ManyToOne
    @JoinColumn(name = "users_id")
    private Users users;

    @Type(JsonType.class)
    @Column(columnDefinition = "json")
    private Map<String, Object> meta;
}
