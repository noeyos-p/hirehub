package com.we.hirehub.repository;

import com.we.hirehub.entity.Comments;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CommentRepository extends JpaRepository<Comments, Long> {
    @EntityGraph(attributePaths = {"users", "board", "parentComments"})
    @Query("SELECT c FROM Comments c ORDER BY c.createAt DESC")
    Page<Comments> findAllWithRelations(Pageable pageable);

    @Query("SELECT c FROM Comments c WHERE c.users.id = :userId ORDER BY c.createAt DESC")
    Page<Comments> findByUserId(@Param("userId") Long userId, Pageable pageable);

    @Query("SELECT c FROM Comments c WHERE c.parentComments.id = :parentId ORDER BY c.createAt ASC")
    List<Comments> findRepliesByParentId(@Param("parentId") Long parentId);

    List<Comments> findByBoardId(Long boardId);
    void deleteByParentComments(Comments parentComments);
    List<Comments> findByParentComments_Id(Long parentId);
    List<Comments> findByBoardIdOrderByCreateAtAsc(Long boardId);
}
