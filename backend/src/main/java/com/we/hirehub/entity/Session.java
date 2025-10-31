package com.we.hirehub.entity;

import com.vladmihalcea.hibernate.type.json.JsonType;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.Type;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/** 완료 */

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Table(name = "session")
public class Session {
    @Id
    private String id;

    @Type(JsonType.class)
    @Column(columnDefinition = "json")
    private Map<String, Object> ctx;

    @OneToMany(mappedBy = "session", fetch = FetchType.LAZY)
    private List<ChatBot> chatBots;

    @OneToMany(mappedBy = "session", fetch = FetchType.LAZY)
    private List<Help> helps;
}
