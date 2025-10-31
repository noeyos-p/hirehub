package com.we.hirehub.service.admin;

import com.we.hirehub.dto.BoardDto;
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

    // ============ DTO 변환 메서드 ============
    private BoardDto convertToDto(Board board) {
        Users user = board.getUsers();

        return BoardDto.builder()
                .id(board.getId())
                .title(board.getTitle())
                .content(board.getContent())
                .usersId(user != null ? user.getId() : null)
                .nickname(user != null ? user.getNickname() : null)  // ✅ usersName → nickname
                .createAt(board.getCreateAt())
                .updateAt(board.getUpdateAt())
                .views(board.getViews())
                .build();
    }

    // ============ 조회 ============
    public Page<BoardDto> getAllBoards(Pageable pageable) {
        log.debug("모든 게시글 조회");
        return boardRepository.findAll(pageable)
                .map(this::convertToDto);
    }

    public BoardDto getBoardById(Long boardId) {
        log.debug("게시글 조회: {}", boardId);
        Board board = boardRepository.findById(boardId)
                .orElseThrow(() -> new IllegalArgumentException("게시글을 찾을 수 없습니다: " + boardId));

        return convertToDto(board);
    }

    public Page<BoardDto> searchBoards(String keyword, Pageable pageable) {
        log.info("게시글 검색: {}", keyword);
        return boardRepository.searchByKeyword(keyword, pageable)
                .map(this::convertToDto);
    }

    // ============ 생성 ============
    @Transactional
    public BoardDto createBoard(Board board) {
        log.info("게시글 생성 요청: {}", board.getTitle());

        // ✅ 필수값 수동 세팅
        board.setCreateAt(LocalDateTime.now());
        board.setViews(0L);

        Board saved = boardRepository.save(board);
        log.info("게시글 생성 완료: {}", saved.getId());

        return convertToDto(saved);
    }

    // ============ 수정 ============
    @Transactional
    public BoardDto updateBoard(Long boardId, Board updateData) {
        log.info("게시글 수정 요청: {}", boardId);

        Board board = boardRepository.findById(boardId)
                .orElseThrow(() -> new IllegalArgumentException("게시글을 찾을 수 없습니다: " + boardId));

        if (updateData.getTitle() != null) board.setTitle(updateData.getTitle());
        if (updateData.getContent() != null) board.setContent(updateData.getContent());

        // ✅ 수정일 자동 갱신
        board.setUpdateAt(LocalDateTime.now());

        Board updated = boardRepository.save(board);
        log.info("게시글 수정 완료: {}", updated.getId());

        return convertToDto(updated);
    }

    // ============ 삭제 ============
    @Transactional
    public void deleteBoard(Long boardId) {
        log.info("게시글 삭제 요청: {}", boardId);

        if (!boardRepository.existsById(boardId)) {
            throw new IllegalArgumentException("존재하지 않는 게시글입니다: " + boardId);
        }

        boardRepository.deleteById(boardId);
        log.info("게시글 삭제 완료: {}", boardId);
    }
}