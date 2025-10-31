package com.we.hirehub.service.admin;

import com.we.hirehub.dto.CommentDto;
import com.we.hirehub.entity.Comments;
import com.we.hirehub.repository.CommentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CommentsAdminService {

    private final CommentRepository commentRepository;

    // ============ 조회 ============

    public Page<CommentDto> getAllComments(Pageable pageable) {
        Page<Comments> commentsPage = commentRepository.findAllWithRelations(pageable);

        // 디버깅용 로그 (첫 댓글만)
        if (!commentsPage.isEmpty()) {
            Comments c = commentsPage.getContent().get(0);
            log.info("=== 첫 번째 댓글 디버깅 ===");
            log.info("댓글 ID: {}", c.getId());
            log.info("댓글 내용: {}", c.getContent());
            log.info("User Email: {}", c.getUsers().getEmail());
            log.info("User Nickname: {}", c.getUsers().getNickname());
            log.info("==========================");
        }

        return commentsPage.map(CommentDto::fromEntity);
    }

    public Page<CommentDto> getCommentsByUserId(Long userId, Pageable pageable) {
        return commentRepository.findByUserId(userId, pageable)
                .map(CommentDto::fromEntity);
    }

    public List<CommentDto> getRepliesByParentId(Long parentId) {
        return commentRepository.findRepliesByParentId(parentId)
                .stream()
                .map(CommentDto::fromEntity)
                .collect(Collectors.toList());
    }

    // ============ 단건 조회 ============

    public Comments getCommentEntityById(Long commentId) {
        return commentRepository.findById(commentId)
                .orElseThrow(() -> new IllegalArgumentException("댓글을 찾을 수 없습니다: " + commentId));
    }

    public CommentDto getCommentById(Long commentId) {
        return CommentDto.fromEntity(getCommentEntityById(commentId));
    }

    // ============ 생성 ============

    @Transactional
    public CommentDto createComment(Comments comment) {
        validateComment(comment);
        comment.setCreateAt(LocalDateTime.now());
        Comments saved = commentRepository.save(comment);
        return CommentDto.fromEntity(saved);
    }

    @Transactional
    public CommentDto createReply(Comments reply) {
        if (reply.getParentComments() == null) {
            throw new IllegalArgumentException("부모 댓글이 필요합니다");
        }
        validateComment(reply);
        reply.setCreateAt(LocalDateTime.now());
        Comments saved = commentRepository.save(reply);
        return CommentDto.fromEntity(saved);
    }

    // ============ 수정 ============

    @Transactional
    public CommentDto updateComment(Long commentId, Comments updateData) {
        Comments comment = getCommentEntityById(commentId);

        if (updateData.getContent() != null && !updateData.getContent().trim().isEmpty()) {
            comment.setContent(updateData.getContent());
        }
        comment.setUpdateAt(LocalDateTime.now());

        Comments updated = commentRepository.save(comment);
        return CommentDto.fromEntity(updated);
    }

    // ============ 삭제 ============

    @Transactional
    public void deleteComment(Long commentId) {
        Comments comment = getCommentEntityById(commentId);

        // 자식 댓글 재귀 삭제
        List<Comments> replies = commentRepository.findRepliesByParentId(commentId);
        for (Comments reply : replies) {
            deleteComment(reply.getId());
        }

        commentRepository.delete(comment);
    }

    // ============ 유효성 검사 ============

    private void validateComment(Comments comment) {
        if (comment.getContent() == null || comment.getContent().trim().isEmpty())
            throw new IllegalArgumentException("댓글 내용이 비어있습니다");
        if (comment.getUsers() == null)
            throw new IllegalArgumentException("사용자 정보가 필요합니다");
        if (comment.getBoard() == null)
            throw new IllegalArgumentException("게시글 정보가 필요합니다");
    }
}
