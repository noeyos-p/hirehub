package com.we.hirehub.controller.admin;

import com.we.hirehub.entity.Review;
import com.we.hirehub.service.admin.ReviewAdminService;
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
 * 관리자 - 리뷰 관리 API
 *
 * 기본 경로: /api/admin/reviews
 * 권한: ADMIN 역할
 */
@Slf4j
@RestController
@RequestMapping("/api/admin/reviews")
@RequiredArgsConstructor
public class ReviewAdminController {

    private final ReviewAdminService reviewService;

    // ============ 조회 ============

    /**
     * 모든 리뷰 조회 (페이징)
     * GET /api/admin/reviews?page=0&size=10
     */
    @GetMapping
    public ResponseEntity<?> getAllReviews(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "id") String sortBy,
            @RequestParam(defaultValue = "DESC") Sort.Direction direction) {

        try {
            Pageable pageable = PageRequest.of(page, size, Sort.by(direction, sortBy));
            Page<Review> reviews = reviewService.getAllReviews(pageable);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "리뷰 조회 성공");
            response.put("data", reviews.getContent());
            response.put("totalElements", reviews.getTotalElements());
            response.put("totalPages", reviews.getTotalPages());
            response.put("currentPage", page);

            log.info("리뷰 조회 성공 - 총 {} 개", reviews.getTotalElements());
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("리뷰 조회 실패", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse(e.getMessage()));
        }
    }


    /**
     * 기업별 리뷰 조회
     * GET /api/admin/reviews/company/{companyId}
     */
    @GetMapping("/company/{companyId}")
    public ResponseEntity<?> getReviewsByCompanyId(
            @PathVariable Long companyId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        try {
            Pageable pageable = PageRequest.of(page, size);
            Page<Review> reviews = reviewService.getReviewsByCompanyId(companyId, pageable);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "기업별 리뷰 조회 성공");
            response.put("companyId", companyId);
            response.put("data", reviews.getContent());
            response.put("totalElements", reviews.getTotalElements());

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("기업별 리뷰 조회 실패", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse(e.getMessage()));
        }
    }


    // ============ 생성 ============

    /**
     * 리뷰 생성
     * POST /api/admin/reviews
     */
    @PostMapping
    public ResponseEntity<?> createReview(@RequestBody Review review) {

        try {
            if (review.getScore() == null || review.getScore() < 1 || review.getScore() > 5) {
                return ResponseEntity.badRequest()
                        .body(createErrorResponse("평점은 1~5 사이여야 합니다"));
            }

            Review createdReview = reviewService.createReview(review);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "리뷰 생성 성공");
            response.put("data", createdReview);

            log.info("리뷰 생성 완료 - 평점: {}", createdReview.getScore());
            return ResponseEntity.status(HttpStatus.CREATED).body(response);

        } catch (IllegalArgumentException e) {
            log.warn("리뷰 생성 실패: {}", e.getMessage());
            return ResponseEntity.badRequest()
                    .body(createErrorResponse(e.getMessage()));
        } catch (Exception e) {
            log.error("리뷰 생성 실패", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse(e.getMessage()));
        }
    }

    // ============ 수정 ============

    /**
     * 리뷰 수정
     * PUT /api/admin/reviews/{reviewId}
     */
    @PutMapping("/{reviewId}")
    public ResponseEntity<?> updateReview(
            @PathVariable Long reviewId,
            @RequestBody Review updateData) {

        try {
            if (reviewId == null || reviewId <= 0) {
                return ResponseEntity.badRequest()
                        .body(createErrorResponse("유효한 리뷰 ID가 필요합니다"));
            }

            if (updateData.getScore() != null && (updateData.getScore() < 1 || updateData.getScore() > 5)) {
                return ResponseEntity.badRequest()
                        .body(createErrorResponse("평점은 1~5 사이여야 합니다"));
            }

            Review updatedReview = reviewService.updateReview(reviewId, updateData);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "리뷰 수정 완료");
            response.put("data", updatedReview);

            log.info("리뷰 수정 완료 - reviewId: {}", reviewId);
            return ResponseEntity.ok(response);

        } catch (IllegalArgumentException e) {
            log.warn("리뷰 수정 실패: {}", e.getMessage());
            return ResponseEntity.badRequest()
                    .body(createErrorResponse(e.getMessage()));
        } catch (Exception e) {
            log.error("리뷰 수정 중 오류", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse(e.getMessage()));
        }
    }

    // ============ 삭제 ============

    /**
     * 리뷰 삭제
     * DELETE /api/admin/reviews/{reviewId}
     */
    @DeleteMapping("/{reviewId}")
    public ResponseEntity<?> deleteReview(@PathVariable Long reviewId) {

        try {
            if (reviewId == null || reviewId <= 0) {
                return ResponseEntity.badRequest()
                        .body(createErrorResponse("유효한 리뷰 ID가 필요합니다"));
            }

            reviewService.deleteReview(reviewId);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "리뷰 삭제 완료");
            response.put("deletedReviewId", reviewId);

            log.info("리뷰 삭제 완료 - reviewId: {}", reviewId);
            return ResponseEntity.ok(response);

        } catch (IllegalArgumentException e) {
            log.warn("리뷰 삭제 실패: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(createErrorResponse(e.getMessage()));
        } catch (Exception e) {
            log.error("리뷰 삭제 중 오류", e);
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