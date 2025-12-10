package com.we.hirehub.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Table(name = "matching")
public class Matching {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "company_id", nullable = false)
  private Company company;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "job_posts_id", nullable = false)
  private JobPosts jobPosts;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "resume_id", nullable = false)
  private Resume resume;

  // 매칭 점수
  @Column(nullable = false)
  private String ranking;

  // 매칭 이유 (추가)
  @Column(columnDefinition = "LONGTEXT")
  private String reason;
}
