package com.we.hirehub.repository;

import com.we.hirehub.entity.Board;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BoardRepository extends JpaRepository<Board, Long> {

    // ================== 기본 목록/검색 ==================

    /** 전체 게시글 페이징 */
    Page<Board> findAll(Pageable pageable);

    /** 제목/내용 키워드 검색 (최신순) */
    @Query("""
           SELECT b
             FROM Board b
            WHERE b.title   LIKE %:keyword%
               OR b.content LIKE %:keyword%
         ORDER BY b.createAt DESC
           """)
    Page<Board> searchByKeyword(@Param("keyword") String keyword, Pageable pageable);

    /** 인기 게시글 TOP6 (조회수 순) */
    List<Board> findTop6ByOrderByViewsDesc();

    /** 전체 최신순 목록 */
    List<Board> findAllByOrderByCreateAtDesc();


    // ================== ✅ 내 게시글 조회 ==================

    /** 특정 사용자 게시글 최신순 (비페이징) — 마이페이지 목록용 */
    List<Board> findByUsers_IdOrderByCreateAtDesc(Long usersId);

    /** 특정 사용자 게시글 페이징 — 필요 시 사용 */
    Page<Board> findByUsers_Id(Long usersId, Pageable pageable);

    List<Board> findByTitleContainingOrContentContaining(String title, String content);
}
