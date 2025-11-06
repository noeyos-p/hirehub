package com.we.hirehub.service;

import com.we.hirehub.dto.BoardDto;
import com.we.hirehub.dto.BoardRequestDto;
import com.we.hirehub.dto.CommentDto;
import com.we.hirehub.entity.Board;
import com.we.hirehub.entity.Users;
import com.we.hirehub.repository.BoardRepository;
import com.we.hirehub.repository.CommentRepository;
import com.we.hirehub.repository.UsersRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BoardService {

    private final BoardRepository boardRepository;
    private final UsersRepository usersRepository;
    private final CommentRepository commentRepository;

    /** 게시글 생성 (with Users) */
    @Transactional
    public Board createBoard(String title, String content, Users user) {
        Board board = Board.builder()
                .title(title)
                .content(content)
                .users(user)
                .createAt(LocalDateTime.now())
                .updateAt(LocalDateTime.now())
                .views(0L)
                .build();
        return boardRepository.save(board);
    }

    /** 게시글 생성 (with userId) */
    @Transactional
    public Board createBoardWithUserId(String title, String content, Long userId) {
        Users user = usersRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));
        Board board = Board.builder()
                .title(title)
                .content(content)
                .users(user)
                .createAt(LocalDateTime.now())
                .updateAt(LocalDateTime.now())
                .views(0L)
                .build();
        return boardRepository.save(board);
    }

    /** 게시글 수정 */
    @Transactional
    public BoardDto updateBoard(Long boardId, BoardRequestDto requestDto) {
        Board board = boardRepository.findById(boardId)
                .orElseThrow(() -> new RuntimeException("게시글을 찾을 수 없습니다."));
        board.setTitle(requestDto.getTitle());
        board.setContent(requestDto.getContent());
        board.setUpdateAt(LocalDateTime.now());
        return toDto(boardRepository.save(board));
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
        return toDto(board);
    }

    /** 전체 최신순 */
    @Transactional(readOnly = true)
    public List<BoardDto> getAllBoards() {
        return boardRepository.findAllByOrderByCreateAtDesc()
                .stream().map(this::toDto).collect(Collectors.toList());
    }

    /** 인기 Top5 */
    @Transactional(readOnly = true)
    public List<BoardDto> getPopularBoards() {
        return boardRepository.findTop6ByOrderByViewsDesc()
                .stream().map(this::toDto).collect(Collectors.toList());
    }

    /** 조회수만 증가 */
    @Transactional
    public BoardDto incrementView(Long boardId) {
        Board board = boardRepository.findById(boardId)
                .orElseThrow(() -> new RuntimeException("게시글을 찾을 수 없습니다."));
        board.setViews(board.getViews() + 1L);
        return toDto(boardRepository.save(board));
    }

    /** ✅ 내 게시글 목록(최신순) */
    @Transactional(readOnly = true)
    public List<BoardDto> getBoardsByUser(Long userId) {
        return boardRepository.findByUsers_IdOrderByCreateAtDesc(userId)
                .stream().map(this::toDto).collect(Collectors.toList());
    }

    /** 엔티티 조회(권한 확인용) */
    @Transactional(readOnly = true)
    public Board getBoardEntity(Long boardId) {
        return boardRepository.findById(boardId)
                .orElseThrow(() -> new RuntimeException("게시글을 찾을 수 없습니다."));
    }

    /** 엔티티 → DTO */
    private BoardDto toDto(Board board) {
        List<CommentDto> commentDtos = commentRepository.findByBoardId(board.getId())
                .stream().map(CommentDto::fromEntity).collect(Collectors.toList());

        return BoardDto.builder()
                .id(board.getId())
                .title(board.getTitle())
                .content(board.getContent())
                .usersId(board.getUsers() != null ? board.getUsers().getId() : null)
                .nickname(board.getUsers() != null ? board.getUsers().getNickname() : "익명")
                .createAt(board.getCreateAt())
                .updateAt(board.getUpdateAt())
                .views(board.getViews())
                .comments(commentDtos)
                .build();
    }

    public List<BoardDto> searchBoards(String keyword) {
        List<Board> boards = boardRepository.findByTitleContainingOrContentContaining(keyword, keyword);
        return boards.stream()
                .map(this::toDto)  // convertToDto → toDto로 변경
                .collect(Collectors.toList());
    }
}
