package com.we.hirehub.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Table(name = "coach")
public class Coach {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "user_id", nullable = false)
  private Users user;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "resume_id", nullable = false)
  private Resume resume;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "job_posts_id", nullable = true)
  private JobPosts jobPosts;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "company_id", nullable = true)
  private Company company;

  // 코칭 질문
  @Column(columnDefinition = "LONGTEXT")
  private String question;

  // 코칭 질문
  @Column(columnDefinition = "LONGTEXT")
  private String answer;

  // 코칭 질문
  @Column(columnDefinition = "LONGTEXT")
  private String feedback;

  // ✅ 새로 추가: 메시지 역할 (USER, AGENT, SYS)
  @Column(name = "role", length = 20)
  private String role;

  // 지원 공고 링크
  @Column(name = "job_post_link", columnDefinition = "TEXT")
  private String jobPostLink;

  // 지원 기업 링크
  @Column(name = "company_link", columnDefinition = "TEXT")
  private String companyLink;
}
