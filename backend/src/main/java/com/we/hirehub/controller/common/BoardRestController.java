package com.we.hirehub.controller.common;

import com.we.hirehub.config.JwtUserPrincipal;
import com.we.hirehub.dto.support.BoardDto;
import com.we.hirehub.entity.Board;
import com.we.hirehub.service.support.BoardService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/board")
@CrossOrigin(origins = "http://localhost:3000", allowCredentials = "true")
@RequiredArgsConstructor
public class BoardRestController {

    private final BoardService boardService;

    private boolean isAdmin(JwtUserPrincipal p) {
        if (p == null) return false;
        try {
            if (p.getRole() != null && p.getRole().toUpperCase().contains("ADMIN")) return true;
        } catch (Exception ignored) {}
        try {
            if (p.getAuthorities() != null) {
                for (GrantedAuthority ga : p.getAuthorities()) {
                    if (ga != null && String.valueOf(ga.getAuthority()).toUpperCase().contains("ADMIN")) {
                        return true;
                    }
                }
            }
        } catch (Exception ignored) {}
        return false;
    }

    // 1) 전체(공개) 목록
    @GetMapping
    public List<BoardDto> getAllBoards() {
        return boardService.getAllBoards();
    }

    // 2) 인기 TOP6
    @GetMapping("/popular")
    public List<BoardDto> getPopularBoards() {
        return boardService.getPopularBoards();
    }

    // 3) 내 글(공개만)
    @GetMapping("/mine")
    public ResponseEntity<?> getMyBoards(@AuthenticationPrincipal JwtUserPrincipal user) {
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("success", false, "message", "로그인이 필요합니다."));
        }
        return ResponseEntity.ok(boardService.getBoardsByUser(user.getUserId()));
    }

    // ✅ 4) 작성 - 즉시 등록 후 성공 응답 (상세 정보 없이)
    @PostMapping
    public ResponseEntity<?> createBoard(@RequestBody BoardDto dto,
                                         @AuthenticationPrincipal JwtUserPrincipal user) {
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(
                    Map.of("success", false, "message", "로그인이 필요합니다.")
            );
        }

        try {
            BoardDto created = boardService.createBoard(user.getUserId(), dto);

            log.info("✅ [CONTROLLER] 게시글 작성 완료 boardId={}, userId={}",
                    created.getId(), user.getUserId());

            // ✅ 생성된 게시글 정보 반환 (프론트에서 상세 페이지로 이동하기 위해)
            return ResponseEntity.ok(created);

        } catch (Exception e) {
            log.error("❌ [CONTROLLER] 게시글 작성 실패", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of(
                            "success", false,
                            "message", "게시글 등록 실패: " + e.getMessage()
                    ));
        }
    }

    // ✅ 5) 단일 조회(+조회수 증가)
    @GetMapping("/{id}")
    public ResponseEntity<?> getBoard(@PathVariable Long id,
                                      @AuthenticationPrincipal JwtUserPrincipal userPrincipal) {
        try {
            BoardDto board = boardService.getBoard(id);
            return ResponseEntity.ok(board);

        } catch (RuntimeException ex) {
            // "숨김 처리된 게시글입니다" 예외 처리
            if (ex.getMessage().contains("숨김")) {
                boolean admin = isAdmin(userPrincipal);

                if (admin) {
                    // 관리자는 숨김 글도 조회 가능
                    try {
                        Board b = boardService.getBoardEntity(id);
                        List<com.we.hirehub.entity.Comments> comments =
                                boardService.getCommentsByBoardId(id);
                        BoardDto dto = BoardDto.toDto(b, comments);

                        return ResponseEntity.ok(dto);
                    } catch (Exception e) {
                        log.error("관리자 조회 실패", e);
                    }
                }

                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(
                        Map.of(
                                "success", false,
                                "message", "이 게시글은 부적절한 내용이 포함되어 관리자 검토 중입니다."
                        )
                );
            }

            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("success", false, "message", ex.getMessage()));
        }
    }

    // 6) 조회수 증가
    @PutMapping("/{id}/view")
    public ResponseEntity<?> incrementView(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(boardService.incrementView(id));
        } catch (RuntimeException ex) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("success", false, "message", ex.getMessage()));
        }
    }

    // 7) 수정 (본인만)
    @PutMapping("/{id}")
    public ResponseEntity<?> updateBoard(@PathVariable Long id,
                                         @RequestBody BoardDto dto,
                                         @AuthenticationPrincipal JwtUserPrincipal user) {
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("success", false, "message", "로그인이 필요합니다."));
        }

        try {
            Board original = boardService.getBoardEntity(id);
            if (original.getUsers() == null || !original.getUsers().getId().equals(user.getUserId())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("success", false, "message", "본인 게시글만 수정할 수 있습니다."));
            }

            BoardDto updated = boardService.updateBoard(id, dto);

            return ResponseEntity.ok(updated);

        } catch (Exception e) {
            log.error("게시글 수정 실패", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    // 8) 삭제 (본인만)
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteBoard(@PathVariable Long id,
                                         @AuthenticationPrincipal JwtUserPrincipal user) {
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("success", false, "message", "로그인이 필요합니다."));
        }

        try {
            Board b = boardService.getBoardEntity(id);
            if (b.getUsers() == null || !b.getUsers().getId().equals(user.getUserId())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("success", false, "message", "본인의 게시글만 삭제할 수 있습니다."));
            }

            boardService.deleteBoard(id);
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "게시글이 삭제되었습니다."
            ));

        } catch (Exception e) {
            log.error("게시글 삭제 실패", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    // 9) 검색(공개글만)
    @GetMapping("/search")
    public List<BoardDto> searchBoards(@RequestParam String keyword) {
        return boardService.searchBoards(keyword);
    }
}