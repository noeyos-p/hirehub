package com.we.hirehub.controller.common;

import com.we.hirehub.config.JwtUserPrincipal;
import com.we.hirehub.dto.support.CommentsDto;
import com.we.hirehub.entity.Users;
import com.we.hirehub.repository.CommentRepository;
import com.we.hirehub.repository.UsersRepository;
import com.we.hirehub.service.support.CommentsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/comment")
@CrossOrigin(origins = "http://localhost:3000")
public class CommentRestController {

    private final CommentsService commentsService;
    private final CommentRepository commentRepository;
    private final UsersRepository usersRepository;

    /**
     * ✅ 댓글 생성
     */
    @PostMapping
    public ResponseEntity<?> createComment(
            @RequestBody CommentsDto commentsDto,
            @AuthenticationPrincipal JwtUserPrincipal userPrincipal
    ) {
        if (userPrincipal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body("로그인된 사용자만 댓글을 작성할 수 있습니다.");
        }

        try {
            // 🔹 로그인된 유저 정보 가져오기
            Long userId = userPrincipal.getUserId();
            Users loggedInUser = usersRepository.findById(userId)
                    .orElseThrow(() -> new IllegalArgumentException("유저를 찾을 수 없습니다."));

            // 🔹 데이터 유효성 검증
            if (commentsDto.getBoardId() == null) {
                return ResponseEntity.badRequest().body("게시글 ID가 누락되었습니다.");
            }
            if (commentsDto.getContent() == null || commentsDto.getContent().trim().isEmpty()) {
                return ResponseEntity.badRequest().body("댓글 내용이 비어 있습니다.");
            }

            // 🔹 댓글 생성
            CommentsDto savedComment = commentsService.createComment(commentsDto, loggedInUser);

            return ResponseEntity.ok(savedComment);

        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("댓글 등록 실패: " + e.getMessage());
        }
    }

    /**
     * ✅ 댓글 수정
     */
    @PutMapping("/{commentId}")
    public ResponseEntity<?> updateComment(
            @PathVariable Long commentId,
            @RequestBody CommentsDto commentsDto,
            @AuthenticationPrincipal JwtUserPrincipal userPrincipal
    ) {
        if (userPrincipal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body("로그인이 필요합니다.");
        }

        try {
            // 댓글 존재 확인
            var comment = commentRepository.findById(commentId)
                    .orElseThrow(() -> new IllegalArgumentException("댓글을 찾을 수 없습니다."));

            // 작성자 본인 확인
            Long userId = userPrincipal.getUserId();
            if (comment.getUsers() == null || !comment.getUsers().getId().equals(userId)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body("본인의 댓글만 수정할 수 있습니다.");
            }

            // 내용 유효성 검증
            if (commentsDto.getContent() == null || commentsDto.getContent().trim().isEmpty()) {
                return ResponseEntity.badRequest().body("댓글 내용이 비어 있습니다.");
            }

            // 댓글 수정
            CommentsDto updatedComment = commentsService.updateComment(commentId, commentsDto.getContent());

            return ResponseEntity.ok(updatedComment);

        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("댓글 수정 실패: " + e.getMessage());
        }
    }

    /**
     * ✅ 댓글 삭제
     */
    @DeleteMapping("/{commentId}")
    public ResponseEntity<?> deleteComment(@PathVariable Long commentId) {
        try {
            commentsService.deleteComment(commentId);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("댓글 삭제 실패: " + e.getMessage());
        }
    }

    /**
     * ✅ 게시글 ID로 댓글 목록 조회
     */
    @GetMapping("/board/{boardId}")
    public ResponseEntity<List<CommentsDto>> getCommentsByBoardId(@PathVariable Long boardId) {
        try {
            List<CommentsDto> comments = commentRepository.findByBoardId(boardId)
                    .stream()
                    .map(comment -> CommentsDto.builder()
                            .id(comment.getId())
                            .content(comment.getContent())
                            .usersId(comment.getUsers() != null ? comment.getUsers().getId() : null)
                            .nickname(comment.getUsers() != null ? comment.getUsers().getNickname() : "익명")
                            .boardId(comment.getBoard() != null ? comment.getBoard().getId() : null)
                            .parentCommentId(comment.getParentComments() != null ? comment.getParentComments().getId() : null)
                            .createAt(comment.getCreateAt())
                            .build())
                    .collect(Collectors.toList());
            return ResponseEntity.ok(comments);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}
