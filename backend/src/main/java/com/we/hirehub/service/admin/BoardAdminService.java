package com.we.hirehub.service.admin;

import com.we.hirehub.dto.support.BoardDto;
import com.we.hirehub.entity.Board;
import com.we.hirehub.entity.Users;
import com.we.hirehub.repository.BoardRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class BoardAdminService {

    private final BoardRepository boardRepository;
    private final com.we.hirehub.repository.CommentRepository commentRepository;
    private final com.we.hirehub.repository.AiBoardControlRepository aiBoardControlRepository;

    // ============ DTO 변환 메서드 ============
    private BoardDto convertToDto(Board board) {
        Users user = board.getUsers();
        return BoardDto.builder()
                .id(board.getId())
                .title(board.getTitle())
                .content(board.getContent())
                .usersId(user != null ? user.getId() : null)
                .nickname(user != null ? user.getNickname() : null)
                .createAt(board.getCreateAt())
                .updateAt(board.getUpdateAt())
                .views(board.getViews())
                .hidden(board.getHidden())
                .build();
    }

    public Page<BoardDto> getAllBoards(Pageable pageable) {
        return boardRepository.findAll(pageable).map(this::convertToDto);
    }

    public BoardDto getBoardById(Long boardId) {
        Board board = boardRepository.findById(boardId)
                .orElseThrow(() -> new IllegalArgumentException("게시글을 찾을 수 없습니다: " + boardId));
        return convertToDto(board);
    }

    public Page<BoardDto> searchBoards(String keyword, Pageable pageable) {
        return boardRepository.searchByKeyword(keyword, pageable).map(this::convertToDto);
    }

    @Transactional
    public BoardDto createBoard(Board board) {
        board.setCreateAt(LocalDateTime.now());
        board.setViews(0L);
        Board saved = boardRepository.save(board);
        return convertToDto(saved);
    }

    @Transactional
    public BoardDto updateBoard(Long boardId, Board update) {
        Board b = boardRepository.findById(boardId)
                .orElseThrow(() -> new IllegalArgumentException("게시글을 찾을 수 없습니다: " + boardId));
        if (update.getTitle() != null) b.setTitle(update.getTitle());
        if (update.getContent() != null) b.setContent(update.getContent());
        b.setUpdateAt(LocalDateTime.now());
        return convertToDto(boardRepository.save(b));
    }

    @Transactional
    public void deleteBoard(Long boardId) {
        if (!boardRepository.existsById(boardId)) {
            throw new IllegalArgumentException("존재하지 않는 게시글입니다: " + boardId);
        }
        // 1. 댓글 삭제
        commentRepository.deleteByBoardId(boardId);
        // 2. AI 차단 내역 삭제
        aiBoardControlRepository.deleteByBoardId(boardId);
        // 3. 게시글 삭제
        boardRepository.deleteById(boardId);
    }
}