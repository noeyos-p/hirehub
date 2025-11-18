package com.we.hirehub.service;

import com.we.hirehub.dto.support.BoardDto;
import com.we.hirehub.entity.Board;
import com.we.hirehub.entity.Comments;
import com.we.hirehub.entity.Users;
import com.we.hirehub.repository.BoardRepository;
import com.we.hirehub.repository.CommentRepository;
import com.we.hirehub.repository.UsersRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BoardService {

    private final BoardRepository boardRepository;
    private final UsersRepository usersRepository;
    private final CommentRepository commentRepository;

    /** 게시글 생성 */
    @Transactional
    public BoardDto createBoard(Long userId, BoardDto dto) {
        Users user = usersRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));

        Board board = dto.toEntity(user);  // DTO의 toEntity 메서드 사용
        Board saved = boardRepository.save(board);

        List<Comments> comments = new ArrayList<>();  // 새 게시글이므로 댓글 없음
        return BoardDto.toDto(saved, comments);
    }

    /** 게시글 수정 */
    @Transactional
    public BoardDto updateBoard(Long boardId, BoardDto dto) {  // BoardRequestDto → BoardDto
        Board board = boardRepository.findById(boardId)
                .orElseThrow(() -> new RuntimeException("게시글을 찾을 수 없습니다."));

        dto.updateEntity(board);  // BoardDto의 updateEntity 메서드 사용
        Board saved = boardRepository.save(board);

        List<Comments> comments = commentRepository.findByBoardId(saved.getId());
        return BoardDto.toDto(saved, comments);
    }

    /** 게시글 삭제 */
    @Transactional
    public void deleteBoard(Long boardId) {
        Board board = boardRepository.findById(boardId)
                .orElseThrow(() -> new RuntimeException("게시글을 찾을 수 없습니다."));
        boardRepository.delete(board);
    }

    /** 단일 조회(+조회수 증가) */
    @Transactional
    public BoardDto getBoard(Long boardId) {
        Board board = boardRepository.findById(boardId)
                .orElseThrow(() -> new RuntimeException("게시글을 찾을 수 없습니다."));
        board.setViews(board.getViews() + 1L);
        boardRepository.save(board);

        List<Comments> comments = commentRepository.findByBoardId(board.getId());
        return BoardDto.toDto(board, comments);
    }

    /** 전체 최신순 */
    @Transactional(readOnly = true)
    public List<BoardDto> getAllBoards() {
        return boardRepository.findAllByOrderByCreateAtDesc()
                .stream()
                .map(board -> {
                    List<Comments> comments = commentRepository.findByBoardId(board.getId());
                    return BoardDto.toDto(board, comments);
                })
                .collect(Collectors.toList());
    }

    /** 인기 Top6 */
    @Transactional(readOnly = true)
    public List<BoardDto> getPopularBoards() {
        return boardRepository.findTop6ByOrderByViewsDesc()
                .stream()
                .map(board -> {
                    List<Comments> comments = commentRepository.findByBoardId(board.getId());
                    return BoardDto.toDto(board, comments);
                })
                .collect(Collectors.toList());
    }

    /** 조회수만 증가 */
    @Transactional
    public BoardDto incrementView(Long boardId) {
        Board board = boardRepository.findById(boardId)
                .orElseThrow(() -> new RuntimeException("게시글을 찾을 수 없습니다."));
        board.setViews(board.getViews() + 1L);
        Board saved = boardRepository.save(board);

        List<Comments> comments = commentRepository.findByBoardId(saved.getId());
        return BoardDto.toDto(saved, comments);
    }

    /** ✅ 내 게시글 목록(최신순) */
    @Transactional(readOnly = true)
    public List<BoardDto> getBoardsByUser(Long userId) {
        return boardRepository.findByUsers_IdOrderByCreateAtDesc(userId)
                .stream()
                .map(board -> {
                    List<Comments> comments = commentRepository.findByBoardId(board.getId());
                    return BoardDto.toDto(board, comments);
                })
                .collect(Collectors.toList());
    }

    /** 엔티티 조회(권한 확인용) */
    @Transactional(readOnly = true)
    public Board getBoardEntity(Long boardId) {
        return boardRepository.findById(boardId)
                .orElseThrow(() -> new RuntimeException("게시글을 찾을 수 없습니다."));
    }

    public List<BoardDto> searchBoards(String keyword) {
        List<Board> boards = boardRepository.findByTitleContainingOrContentContaining(keyword, keyword);
        return boards.stream()
                .map(board -> {
                    List<Comments> comments = commentRepository.findByBoardId(board.getId());
                    return BoardDto.toDto(board, comments);
                })
                .collect(Collectors.toList());
    }
}