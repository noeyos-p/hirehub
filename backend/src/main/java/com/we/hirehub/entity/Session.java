package com.we.hirehub.entity;

import com.vladmihalcea.hibernate.type.json.JsonType;
import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.Type;

import java.util.Map;

@Entity
@Data
@Table(name = "session")
public class Session {
    @Id
    private String id;

    @ManyToOne
    @JoinColumn(name = "users_id")
    private Users users;

    @Type(JsonType.class)
    @Column(columnDefinition = "json")
    private Map<String, Object> ctx;
}
