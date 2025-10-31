package com.we.hirehub.controller.admin;

import com.we.hirehub.entity.Users;
import com.we.hirehub.service.admin.UsersAdminService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

/**
 * 관리자 - 사용자 관리 API
 *
 * 기본 경로: /api/admin/users
 * 권한: ADMIN 역할
 */
@Slf4j
@RestController
@RequestMapping("/api/admin/user-management")
@RequiredArgsConstructor
public class UsersAdminController {

    private final UsersAdminService usersService;


    // ============ 조회 ============

    /**
     * 모든 사용자 조회 (페이징)
     * GET /api/admin/users?page=0&size=10
     */
    @GetMapping
    public ResponseEntity<?> getAllUsers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "id") String sortBy,
            @RequestParam(defaultValue = "DESC") Sort.Direction direction) {

        try {
            Pageable pageable = PageRequest.of(page, size, Sort.by(direction, sortBy));
            Page<Users> users = usersService.getAllUsers(pageable);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "사용자 조회 성공");
            response.put("data", users.getContent());
            response.put("totalElements", users.getTotalElements());
            response.put("totalPages", users.getTotalPages());
            response.put("currentPage", page);

            log.info("사용자 조회 성공 - 총 {} 명", users.getTotalElements());
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("사용자 조회 실패", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse(e.getMessage()));
        }
    }

    @PostMapping
    public ResponseEntity<?> createUser(@RequestBody Users user) {
        try {
            // ✅ 필수 필드 검증
            if (user.getEmail() == null || user.getEmail().trim().isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(createErrorResponse("이메일이 필요합니다"));
            }
            if (user.getPassword() == null || user.getPassword().trim().isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(createErrorResponse("비밀번호가 필요합니다"));
            }
            if (user.getNickname() == null || user.getNickname().trim().isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(createErrorResponse("닉네임이 필요합니다"));
            }

            Users createdUser = usersService.createUser(user);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "사용자 등록 성공");
            response.put("data", createdUser);

            log.info("사용자 등록 완료 - email: {}", createdUser.getEmail());
            return ResponseEntity.status(HttpStatus.CREATED).body(response);

        } catch (IllegalArgumentException e) {
            log.warn("사용자 등록 실패: {}", e.getMessage());
            return ResponseEntity.badRequest()
                    .body(createErrorResponse(e.getMessage()));
        } catch (Exception e) {
            log.error("사용자 등록 실패", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse(e.getMessage()));
        }
    }

    // ============ 수정 ============

    /**
     * 사용자 정보 수정
     * PUT /api/admin/users/{userId}
     */
    @PutMapping("/{userId}")
    public ResponseEntity<?> updateUser(
            @PathVariable Long userId,
            @RequestBody Users updateData) {

        try {
            if (userId == null || userId <= 0) {
                return ResponseEntity.badRequest()
                        .body(createErrorResponse("유효한 사용자 ID가 필요합니다"));
            }

            Users updatedUser = usersService.updateUser(userId, updateData);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "사용자 정보 수정 완료");
            response.put("data", updatedUser);

            log.info("사용자 정보 수정 완료 - userId: {}", userId);
            return ResponseEntity.ok(response);

        } catch (IllegalArgumentException e) {
            log.warn("사용자 수정 실패: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(createErrorResponse(e.getMessage()));
        } catch (Exception e) {
            log.error("사용자 수정 중 오류", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse(e.getMessage()));
        }
    }

    // ============ 삭제 ============

    /**
     * 사용자 삭제
     * DELETE /api/admin/users/{userId}
     */
    @DeleteMapping("/{userId}")
    public ResponseEntity<?> deleteUser(@PathVariable Long userId) {

        try {
            if (userId == null || userId <= 0) {
                return ResponseEntity.badRequest()
                        .body(createErrorResponse("유효한 사용자 ID가 필요합니다"));
            }

            usersService.deleteUser(userId);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "사용자 삭제 완료");
            response.put("deletedUserId", userId);

            log.info("사용자 삭제 완료 - userId: {}", userId);
            return ResponseEntity.ok(response);

        } catch (IllegalArgumentException e) {
            log.warn("사용자 삭제 실패: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(createErrorResponse(e.getMessage()));
        } catch (Exception e) {
            log.error("사용자 삭제 중 오류", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse(e.getMessage()));
        }
    }


    /**
     * 에러 응답 생성
     */
    private Map<String, Object> createErrorResponse(String message) {
        Map<String, Object> response = new HashMap<>();
        response.put("success", false);
        response.put("message", message);
        return response;
    }
}