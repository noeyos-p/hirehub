package com.we.hirehub.controller.admin;

import com.we.hirehub.dto.CommentDto;
import com.we.hirehub.entity.Comments;
import com.we.hirehub.service.admin.CommentsAdminService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.*;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;

import java.util.*;

/**
 * 관리자 - 댓글 관리 API
 * 기본 경로: /api/admin/comments
 * 권한: ADMIN
 */
@Slf4j
@RestController
@RequestMapping("/api/admin/comments")
@RequiredArgsConstructor
public class CommentsAdminController {

    private final CommentsAdminService commentsService;

    // ============ 전체 조회 ============

    /**
     * 모든 댓글 조회 (페이징)
     * GET /api/admin/comments?page=0&size=10
     */
    @GetMapping
    public ResponseEntity<?> getAllComments(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createAt") String sortBy,
            @RequestParam(defaultValue = "DESC") Sort.Direction direction) {

        try {
            Pageable pageable = PageRequest.of(page, size, Sort.by(direction, sortBy));
            Page<CommentDto> comments = commentsService.getAllComments(pageable);

            Map<String, Object> response = Map.of(
                    "success", true,
                    "message", "댓글 조회 성공",
                    "data", comments.getContent(),
                    "totalElements", comments.getTotalElements(),
                    "totalPages", comments.getTotalPages(),
                    "currentPage", page
            );

            log.info("✅ 댓글 조회 성공 - 총 {}개", comments.getTotalElements());
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("❌ 댓글 조회 실패", e);
            return error(HttpStatus.INTERNAL_SERVER_ERROR, e.getMessage());
        }
    }

    // ============ 사용자별 조회 ============

    /**
     * 특정 사용자 댓글 조회
     * GET /api/admin/comments/user/{userId}
     */
    @GetMapping("/user/{userId}")
    public ResponseEntity<?> getCommentsByUserId(
            @PathVariable Long userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        try {
            Pageable pageable = PageRequest.of(page, size);
            Page<CommentDto> comments = commentsService.getCommentsByUserId(userId, pageable);

            Map<String, Object> response = Map.of(
                    "success", true,
                    "message", "사용자별 댓글 조회 성공",
                    "userId", userId,
                    "data", comments.getContent(),
                    "totalElements", comments.getTotalElements()
            );

            log.info("✅ 사용자별 댓글 조회 성공 - userId: {}", userId);
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("❌ 사용자별 댓글 조회 실패", e);
            return error(HttpStatus.INTERNAL_SERVER_ERROR, e.getMessage());
        }
    }

    // ============ 대댓글 조회 ============

    /**
     * 부모 댓글의 대댓글(답글) 조회
     * GET /api/admin/comments/{parentId}/replies
     */
    @GetMapping("/{parentId}/replies")
    public ResponseEntity<?> getRepliesByParentId(@PathVariable Long parentId) {
        try {
            List<CommentDto> replies = commentsService.getRepliesByParentId(parentId);

            Map<String, Object> response = Map.of(
                    "success", true,
                    "message", "대댓글 조회 성공",
                    "parentId", parentId,
                    "totalReplies", replies.size(),
                    "data", replies
            );

            log.info("✅ 대댓글 조회 성공 - parentId: {}", parentId);
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("❌ 대댓글 조회 실패", e);
            return error(HttpStatus.INTERNAL_SERVER_ERROR, e.getMessage());
        }
    }

    // ============ 생성 ============

    /**
     * 댓글 생성
     * POST /api/admin/comments
     */
    @PostMapping
    public ResponseEntity<?> createComment(@RequestBody Comments comment) {
        try {
            if (comment.getContent() == null || comment.getContent().trim().isEmpty()) {
                return error(HttpStatus.BAD_REQUEST, "댓글 내용이 필요합니다");
            }

            CommentDto created = commentsService.createComment(comment);
            Map<String, Object> response = Map.of(
                    "success", true,
                    "message", "댓글 생성 성공",
                    "data", created
            );

            log.info("✅ 댓글 생성 완료");
            return ResponseEntity.status(HttpStatus.CREATED).body(response);

        } catch (IllegalArgumentException e) {
            return error(HttpStatus.BAD_REQUEST, e.getMessage());
        } catch (Exception e) {
            log.error("❌ 댓글 생성 실패", e);
            return error(HttpStatus.INTERNAL_SERVER_ERROR, e.getMessage());
        }
    }

    // ============ 대댓글 생성 ============

    /**
     * 대댓글(답글) 생성
     * POST /api/admin/comments/{parentId}/reply
     */
    @PostMapping("/{parentId}/reply")
    public ResponseEntity<?> createReply(
            @PathVariable Long parentId,
            @RequestBody Comments reply) {
        try {
            if (reply.getContent() == null || reply.getContent().trim().isEmpty()) {
                return error(HttpStatus.BAD_REQUEST, "댓글 내용이 필요합니다");
            }

            if (reply.getParentComments() == null) {
                reply.setParentComments(commentsService.getCommentEntityById(parentId));
            }

            CommentDto created = commentsService.createReply(reply);
            Map<String, Object> response = Map.of(
                    "success", true,
                    "message", "대댓글 생성 성공",
                    "data", created
            );

            log.info("✅ 대댓글 생성 완료 - parentId: {}", parentId);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);

        } catch (IllegalArgumentException e) {
            return error(HttpStatus.BAD_REQUEST, e.getMessage());
        } catch (Exception e) {
            log.error("❌ 대댓글 생성 실패", e);
            return error(HttpStatus.INTERNAL_SERVER_ERROR, e.getMessage());
        }
    }

    // ============ 수정 ============

    /**
     * 댓글 수정
     * PUT /api/admin/comments/{commentId}
     */
    @PutMapping("/{commentId}")
    public ResponseEntity<?> updateComment(
            @PathVariable Long commentId,
            @RequestBody Comments updateData) {
        try {
            if (commentId == null || commentId <= 0) {
                return error(HttpStatus.BAD_REQUEST, "유효한 댓글 ID가 필요합니다");
            }

            CommentDto updated = commentsService.updateComment(commentId, updateData);
            Map<String, Object> response = Map.of(
                    "success", true,
                    "message", "댓글 수정 성공",
                    "data", updated
            );

            log.info("✅ 댓글 수정 완료 - commentId: {}", commentId);
            return ResponseEntity.ok(response);

        } catch (IllegalArgumentException e) {
            return error(HttpStatus.BAD_REQUEST, e.getMessage());
        } catch (Exception e) {
            log.error("❌ 댓글 수정 실패", e);
            return error(HttpStatus.INTERNAL_SERVER_ERROR, e.getMessage());
        }
    }

    // ============ 삭제 ============

    /**
     * 댓글 삭제 (대댓글 포함)
     * DELETE /api/admin/comments/{commentId}
     */
    @DeleteMapping("/{commentId}")
    public ResponseEntity<?> deleteComment(@PathVariable Long commentId) {
        try {
            if (commentId == null || commentId <= 0) {
                return error(HttpStatus.BAD_REQUEST, "유효한 댓글 ID가 필요합니다");
            }

            List<CommentDto> replies = commentsService.getRepliesByParentId(commentId);
            int deletedReplies = replies.size();

            commentsService.deleteComment(commentId);

            Map<String, Object> response = Map.of(
                    "success", true,
                    "message", "댓글 삭제 성공",
                    "deletedCommentId", commentId,
                    "deletedRepliesCount", deletedReplies
            );

            log.info("✅ 댓글 삭제 완료 - commentId: {}, 대댓글 {}개 함께 삭제", commentId, deletedReplies);
            return ResponseEntity.ok(response);

        } catch (IllegalArgumentException e) {
            return error(HttpStatus.NOT_FOUND, e.getMessage());
        } catch (Exception e) {
            log.error("❌ 댓글 삭제 실패", e);
            return error(HttpStatus.INTERNAL_SERVER_ERROR, e.getMessage());
        }
    }

    // ============ 공통 에러 응답 ============
    private ResponseEntity<Map<String, Object>> error(HttpStatus status, String message) {
        return ResponseEntity.status(status).body(Map.of(
                "success", false,
                "message", message
        ));
    }
}
