package com.we.hirehub.controller.admin;

import com.we.hirehub.dto.BoardDto;
import com.we.hirehub.entity.Users;
import com.we.hirehub.service.admin.BoardAdminService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

/**
 * 관리자 - 게시판 관리 API
 * <p>
 * 기본 경로: /api/admin/board-management
 * 권한: ADMIN 역할
 */
@Slf4j
@RestController
@RequestMapping("/api/admin/board-management")
@RequiredArgsConstructor
public class BoardAdminController {

    private final BoardAdminService boardService;

    // ============ 조회 ============

    /**
     * 모든 게시글 조회 (페이징)
     * GET /api/admin/board-management?page=0&size=10&sortBy=createAt&direction=DESC
     */
    @GetMapping
    public ResponseEntity<?> getAllBoards(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createAt") String sortBy,
            @RequestParam(defaultValue = "DESC") Sort.Direction direction) {

        try {
            Pageable pageable = PageRequest.of(page, size, Sort.by(direction, sortBy));
            Page<BoardDto> boards = boardService.getAllBoards(pageable);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "게시글 조회 성공");
            response.put("data", boards.getContent());
            response.put("totalElements", boards.getTotalElements());
            response.put("totalPages", boards.getTotalPages());
            response.put("currentPage", page);

            log.info("게시글 조회 성공 - 총 {} 개", boards.getTotalElements());
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("게시글 조회 실패", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse(e.getMessage()));
        }
    }

    /**
     * 게시글 검색
     * GET /api/admin/board-management/search?keyword=spring
     */
    @GetMapping("/search")
    public ResponseEntity<?> searchBoards(
            @RequestParam String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        try {
            if (keyword == null || keyword.trim().isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(createErrorResponse("검색 키워드가 필요합니다."));
            }

            Pageable pageable = PageRequest.of(page, size);
            Page<BoardDto> boards = boardService.searchBoards(keyword, pageable);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "게시글 검색 성공");
            response.put("keyword", keyword);
            response.put("data", boards.getContent());
            response.put("totalElements", boards.getTotalElements());

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("게시글 검색 실패", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse(e.getMessage()));
        }
    }

    // ============ 생성 ============

    /**
     * 게시글 생성
     * POST /api/admin/board-management
     */
    @PostMapping
    public ResponseEntity<?> createBoard(
            @AuthenticationPrincipal Long userId,
            @RequestBody BoardDto boardDto) {

        try {
            if (userId == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(createErrorResponse("로그인된 사용자 정보가 없습니다."));
            }

            if (boardDto.getTitle() == null || boardDto.getTitle().trim().isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(createErrorResponse("게시글 제목이 필요합니다."));
            }

            // ✅ DTO → Entity 변환
            com.we.hirehub.entity.Board board = toEntity(boardDto);

            // ✅ 로그인한 사용자(userId)를 Users로 세팅
            Users user = new Users();
            user.setId(userId);
            board.setUsers(user);

            // ✅ 생성
            BoardDto createdBoard = boardService.createBoard(board);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "게시글 생성 성공");
            response.put("data", createdBoard);

            log.info("게시글 생성 완료 - userId: {}, title: {}", userId, createdBoard.getTitle());
            return ResponseEntity.status(HttpStatus.CREATED).body(response);

        } catch (Exception e) {
            log.error("게시글 생성 실패", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse(e.getMessage()));
        }
    }

    // ============ 수정 ============

    /**
     * 게시글 수정
     * PUT /api/admin/board-management/{boardId}
     */
    @PutMapping("/{boardId}")
    public ResponseEntity<?> updateBoard(
            @PathVariable Long boardId,
            @RequestBody BoardDto updateDto) {

        try {
            if (boardId == null || boardId <= 0) {
                return ResponseEntity.badRequest()
                        .body(createErrorResponse("유효한 게시글 ID가 필요합니다."));
            }

            BoardDto updatedBoard = boardService.updateBoard(boardId, toEntity(updateDto));

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "게시글 수정 완료");
            response.put("data", updatedBoard);

            log.info("게시글 수정 완료 - boardId: {}", boardId);
            return ResponseEntity.ok(response);

        } catch (IllegalArgumentException e) {
            log.warn("게시글 수정 실패: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(createErrorResponse(e.getMessage()));
        } catch (Exception e) {
            log.error("게시글 수정 중 오류", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse(e.getMessage()));
        }
    }

    // ============ 삭제 ============

    /**
     * 게시글 삭제
     * DELETE /api/admin/board-management/{boardId}
     */
    @DeleteMapping("/{boardId}")
    public ResponseEntity<?> deleteBoard(@PathVariable Long boardId) {

        try {
            if (boardId == null || boardId <= 0) {
                return ResponseEntity.badRequest()
                        .body(createErrorResponse("유효한 게시글 ID가 필요합니다."));
            }

            boardService.deleteBoard(boardId);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "게시글 삭제 완료");
            response.put("deletedBoardId", boardId);

            log.info("게시글 삭제 완료 - boardId: {}", boardId);
            return ResponseEntity.ok(response);

        } catch (IllegalArgumentException e) {
            log.warn("게시글 삭제 실패: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(createErrorResponse(e.getMessage()));
        } catch (Exception e) {
            log.error("게시글 삭제 중 오류", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse(e.getMessage()));
        }
    }

    // ============ 유틸 ============

    private Map<String, Object> createErrorResponse(String message) {
        Map<String, Object> response = new HashMap<>();
        response.put("success", false);
        response.put("message", message);
        return response;
    }

    /**
     * DTO → Entity 변환 (간단 버전)
     */
    private com.we.hirehub.entity.Board toEntity(BoardDto dto) {
        com.we.hirehub.entity.Board board = new com.we.hirehub.entity.Board();
        board.setId(dto.getId());
        board.setTitle(dto.getTitle());
        board.setContent(dto.getContent());
        board.setCreateAt(dto.getCreateAt());
        board.setUpdateAt(dto.getUpdateAt());
        board.setViews(dto.getViews());
        return board;
    }
}
