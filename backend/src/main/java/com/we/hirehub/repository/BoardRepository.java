package com.we.hirehub.repository;

import com.we.hirehub.entity.Board;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface BoardRepository extends JpaRepository<Board, Long> {

    /** 전체 최신순 (관리/백오피스용) */
    List<Board> findAllByOrderByCreateAtDesc();

    /** 인기 TOP6 (숨김 제외) */
    List<Board> findTop6ByHiddenFalseOrderByViewsDesc();

    /** 인기 TOP6 (기존 시그니처 유지 — 숨김 필터 없이) */
    List<Board> findTop6ByOrderByViewsDesc();

    /** 공개 게시글 최신순 */
    List<Board> findByHiddenFalseOrderByCreateAtDesc();

    /** 특정 사용자 공개 게시글 최신순 */
    List<Board> findByUsers_IdAndHiddenFalseOrderByCreateAtDesc(Long usersId);

    /** 배치 재검열 후보: 최근 after 이후 + 현재 공개글만 */
    List<Board> findByHiddenFalseAndCreateAtAfter(LocalDateTime after, Pageable pageable);

    /** 전체 공개글 페이징(재검열 등) */
    List<Board> findByHiddenFalse(Pageable pageable);

    /** AI 중복 방지 해시 */
    boolean existsByAiHash(String aiHash);

    /** 관리자 검색 (숨김 포함, 최신순) — BoardAdminService에서 사용 */
    @Query("""
           SELECT b
             FROM Board b
            WHERE b.title   LIKE %:keyword%
               OR b.content LIKE %:keyword%
         ORDER BY b.createAt DESC
           """)
    Page<Board> searchByKeyword(@Param("keyword") String keyword, Pageable pageable);

    /** 공개글 검색 (숨김 제외, 최신순) — 프론트 검색용 */
    @Query("""
           SELECT b
             FROM Board b
            WHERE b.hidden = false
              AND (b.title LIKE %:keyword% OR b.content LIKE %:keyword%)
         ORDER BY b.createAt DESC
           """)
    List<Board> searchVisibleBoards(@Param("keyword") String keyword);

    /** 역할별 게시글 (예: BOT) 최신순 */
    List<Board> findByRoleOrderByCreateAtDesc(String role);
}
