package com.we.hirehub.controller;

import com.we.hirehub.dto.CommentDto;
import com.we.hirehub.entity.Users;
import com.we.hirehub.repository.CommentRepository;
import com.we.hirehub.repository.UsersRepository;
import com.we.hirehub.service.CommentService;
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
@CrossOrigin(origins = "http://localhost:3000") // React 앱 포트
public class CommentRestController {
    private final CommentService commentService;
    private final CommentRepository commentRepository;
    private final UsersRepository usersRepository;

    /**
     * 댓글 생성
     */
    @PostMapping
    public ResponseEntity<?> createComment(@RequestBody CommentDto commentDto,
                                           @AuthenticationPrincipal Long userId) {
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body("로그인된 사용자만 댓글을 작성할 수 있습니다.");
        }

        try {
            // ✅ 로그인한 유저 조회
            Users loggedInUser = usersRepository.findById(userId)
                    .orElseThrow(() -> new IllegalArgumentException("유저를 찾을 수 없습니다."));

            // ✅ 필수 데이터 검증
            if (commentDto.getBoardId() == null) {
                return ResponseEntity.badRequest().body("게시글 ID가 누락되었습니다.");
            }
            if (commentDto.getContent() == null || commentDto.getContent().trim().isEmpty()) {
                return ResponseEntity.badRequest().body("댓글 내용이 비어 있습니다.");
            }

            // ✅ 댓글 생성 (서비스 계층에 위임)
            CommentDto savedComment = commentService.createComment(commentDto, loggedInUser);

            // ✅ 성공 응답 (저장된 댓글 DTO 반환)
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
     * 댓글 삭제
     */
    @DeleteMapping("/{commentId}")
    public ResponseEntity<?> deleteComment(@PathVariable Long commentId) {
        try {
            commentService.deleteComment(commentId);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("댓글 삭제 실패: " + e.getMessage());
        }
    }

    /**
     * 게시글 ID로 댓글 목록 조회
     */
    @GetMapping("/board/{boardId}")
    public ResponseEntity<List<CommentDto>> getCommentsByBoardId(@PathVariable Long boardId) {
        try {
            // 모든 댓글을 반환 (대댓글 포함)
            List<CommentDto> comments = commentRepository.findByBoardId(boardId)
                    .stream()
                    .map(comment -> CommentDto.builder()
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
