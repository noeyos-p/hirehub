package com.we.hirehub.service;

import com.we.hirehub.dto.CommentDto;
import com.we.hirehub.entity.Board;
import com.we.hirehub.entity.Comments;
import com.we.hirehub.entity.Users;
import com.we.hirehub.repository.BoardRepository;
import com.we.hirehub.repository.CommentRepository;
import com.we.hirehub.repository.UsersRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class CommentService {
    private final CommentRepository commentRepository;
    private final UsersRepository usersRepository;
    private final BoardRepository boardRepository;

    /**
     * 댓글 생성 (로그인된 사용자)
     */
    @Transactional
    public CommentDto createComment(CommentDto commentDto, Users user) {
        Board board = boardRepository.findById(commentDto.getBoardId())
                .orElseThrow(() -> new RuntimeException("게시글을 찾을 수 없습니다."));

        Comments parentComment = null;
        if (commentDto.getParentCommentId() != null) {
            parentComment = commentRepository.findById(commentDto.getParentCommentId())
                    .orElseThrow(() -> new RuntimeException("부모 댓글을 찾을 수 없습니다."));
        }

        Comments comment = Comments.builder()
                .content(commentDto.getContent())
                .users(user)
                .board(board)
                .parentComments(parentComment)
                .createAt(LocalDateTime.now())
                .updateAt(LocalDateTime.now())
                .build();

        return toDto(commentRepository.save(comment));
    }

    /**
     * 댓글 생성 (더미 사용자)
     */
    @Transactional
    public CommentDto createCommentWithUserId(String content, Long boardId, Long parentCommentId, Long userId) {
        Users user = usersRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));
        Board board = boardRepository.findById(boardId)
                .orElseThrow(() -> new RuntimeException("게시글을 찾을 수 없습니다."));

        Comments parentComment = null;
        if (parentCommentId != null) {
            parentComment = commentRepository.findById(parentCommentId)
                    .orElseThrow(() -> new RuntimeException("부모 댓글을 찾을 수 없습니다."));
        }

        Comments comment = Comments.builder()
                .content(content)
                .users(user)
                .board(board)
                .parentComments(parentComment)
                .createAt(LocalDateTime.now())
                .updateAt(LocalDateTime.now())
                .build();

        return toDto(commentRepository.save(comment));
    }

    /**
     * 댓글 삭제
     */
    @Transactional
    public void deleteComment(Long commentId) {
        Comments comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new RuntimeException("댓글을 찾을 수 없습니다."));
        // 대댓글도 함께 삭제 (cascade 설정이 없으므로 명시적으로 처리)
        commentRepository.deleteByParentComments(comment);
        commentRepository.delete(comment);
    }

    /**
     * 게시글 ID로 댓글 목록 조회 (대댓글 포함)
     */
    @Transactional(readOnly = true)
    public List<CommentDto> getCommentsByBoardId(Long boardId) {
        // 모든 댓글을 조회 (부모 댓글 + 대댓글)
        List<Comments> allComments = commentRepository.findByBoardId(boardId);

        // 최상위 댓글만 필터링
        return allComments.stream()
                .filter(comment -> comment.getParentComments() == null) // 최상위 댓글만
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    /**
     * Comments → CommentDto 변환
     */
    private CommentDto toDto(Comments comment) {
        return CommentDto.builder()
                .id(comment.getId())
                .content(comment.getContent())
                .usersId(comment.getUsers() != null ? comment.getUsers().getId() : null)
                .nickname(comment.getUsers() != null ? comment.getUsers().getNickname() : "익명")
                .boardId(comment.getBoard() != null ? comment.getBoard().getId() : null)
                .parentCommentId(comment.getParentComments() != null ? comment.getParentComments().getId() : null)
                .createAt(comment.getCreateAt())
                .build();
    }
}
