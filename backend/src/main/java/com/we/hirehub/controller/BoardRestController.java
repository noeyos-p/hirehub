package com.we.hirehub.controller;

import com.we.hirehub.config.JwtUserPrincipal;
import com.we.hirehub.dto.BoardDto;
import com.we.hirehub.dto.BoardRequestDto;
import com.we.hirehub.entity.Board;
import com.we.hirehub.entity.Users;
import com.we.hirehub.repository.UsersRepository;
import com.we.hirehub.service.BoardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/board")
@CrossOrigin(origins = "http://localhost:3000", allowCredentials = "true")
@RequiredArgsConstructor
public class BoardRestController {

    private final BoardService boardService;
    private final UsersRepository usersRepository;

    /** 전체 게시물 */
    @GetMapping
    public List<BoardDto> getAllBoards() {
        return boardService.getAllBoards();
    }

    /** 인기 게시물 */
    @GetMapping("/popular")
    public List<BoardDto> getPopularBoards() {
        return boardService.getPopularBoards();
    }

    /** ✅ 내가 쓴 게시물(최신순) */
    @GetMapping("/mine")
    public ResponseEntity<?> getMyBoards(@AuthenticationPrincipal JwtUserPrincipal userPrincipal) {
        if (userPrincipal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("로그인이 필요합니다.");
        }
        return ResponseEntity.ok(boardService.getBoardsByUser(userPrincipal.getUserId()));
    }

    /** ✅ 게시물 작성 */
    @PostMapping
    public ResponseEntity<?> createBoard(@RequestBody BoardRequestDto req,
                                         @AuthenticationPrincipal JwtUserPrincipal userPrincipal) {
        if (userPrincipal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("로그인이 필요합니다.");
        }

        try {
            Long userId = userPrincipal.getUserId();
            Users user = usersRepository.findById(userId)
                    .orElseThrow(() -> new IllegalArgumentException("유저를 찾을 수 없습니다."));
            Board board = boardService.createBoard(req.getTitle(), req.getContent(), user);
            return ResponseEntity.ok(board);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("게시글 등록 실패: " + e.getMessage());
        }
    }

    /** 단건 조회(+조회수 증가) */
    @GetMapping("/{id}")
    public BoardDto getBoard(@PathVariable Long id) {
        return boardService.getBoard(id);
    }

    /** 조회수만 증가 */
    @PutMapping("/{id}/view")
    public BoardDto incrementView(@PathVariable Long id) {
        return boardService.incrementView(id);
    }

    /** ✅ 게시글 수정 (작성자 본인만) */
    @PutMapping("/{id}")
    public ResponseEntity<?> updateBoard(@PathVariable Long id,
                                         @RequestBody BoardRequestDto req,
                                         @AuthenticationPrincipal JwtUserPrincipal userPrincipal) {
        if (userPrincipal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("로그인이 필요합니다.");
        }

        Long userId = userPrincipal.getUserId();
        Board entity = boardService.getBoardEntity(id);
        if (entity.getUsers() == null || !entity.getUsers().getId().equals(userId)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("본인 게시글만 수정할 수 있습니다.");
        }
        return ResponseEntity.ok(boardService.updateBoard(id, req));
    }

    /** 게시글 삭제 (작성자 본인만) */
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteBoard(@PathVariable Long id,
                                         @AuthenticationPrincipal JwtUserPrincipal userPrincipal) {
        if (userPrincipal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("로그인이 필요합니다.");
        }

        Long userId = userPrincipal.getUserId();
        Board board = boardService.getBoardEntity(id);
        if (board.getUsers() == null || !board.getUsers().getId().equals(userId)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("본인의 게시글만 삭제할 수 있습니다.");
        }
        boardService.deleteBoard(id);
        return ResponseEntity.ok("게시글이 삭제되었습니다.");
    }

    /** 게시글 검색 */
    @GetMapping("/search")
    public List<BoardDto> searchBoards(@RequestParam String keyword) {
        return boardService.searchBoards(keyword);
    }
}
