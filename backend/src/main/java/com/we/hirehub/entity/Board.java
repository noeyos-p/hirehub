package com.we.hirehub.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/** 완료 */

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Table(name = "board")
public class Board {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  // 게시글 제목
  @Column(length = 255, nullable = false)
  private String title;

  // 게시글 내용
  @Column(columnDefinition = "LONGTEXT", nullable = false)
  private String content;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "users_id", nullable = false)
  private Users users;

  // 게시글 작성한 날짜 및 시간 표시
  @Column(name = "create_at", nullable = false)
  private LocalDateTime createAt;

  // 게시글 수정한 날짜 및 시간 표시
  @Column(name = "update_at")
  private LocalDateTime updateAt;

  // 조회수
  @Column(nullable = false, columnDefinition = "BIGINT DEFAULT 0")
  @Builder.Default
  private Long views = 0L;

  // 숨김 여부
  @Column(nullable = false)
  @Builder.Default
  private Boolean hidden = false;

  // 역할 (USER, BOT, ADMIN 등)
  @Column(length = 20)
  private String role;

  @Column(length = 500)
  private String tagsCsv; // "채용트렌드,공공기관채용"

  @Column(name = "ai_hash", unique = true)
  private String aiHash;

  // 관리자 승인 여부 (true면 AI가 차단하지 못함)
  @Column(name = "admin_approved", nullable = false)
  @Builder.Default
  private Boolean adminApproved = false;
}
