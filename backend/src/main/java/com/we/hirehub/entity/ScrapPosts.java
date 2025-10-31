package com.we.hirehub.entity;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Data
@Table(name = "scrap_posts")
public class ScrapPosts {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "users_id", nullable = false)
    private Users users;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "job_posts_id", nullable = false)
    private JobPosts jobPosts;

}
