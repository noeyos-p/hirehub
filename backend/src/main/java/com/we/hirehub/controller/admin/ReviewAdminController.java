package com.we.hirehub.controller.admin;

import com.we.hirehub.dto.ReviewDto;
import com.we.hirehub.entity.Review;
import com.we.hirehub.service.admin.ReviewAdminService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/reviews")
@RequiredArgsConstructor
public class ReviewAdminController {

    private final ReviewAdminService reviewAdminService;

    /** 전체 리뷰 조회 (페이징, DTO 반환) */
    @GetMapping
    public Page<ReviewDto> getAllReviews(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        return reviewAdminService.getAllReviews(PageRequest.of(page, size));
    }

    /** 특정 리뷰 조회 */
    @GetMapping("/{id}")
    public ReviewDto getReview(@PathVariable Long id) {
        return reviewAdminService.getReviewByIdDto(id);
    }

    /** 특정 회사 리뷰 조회 */
    @GetMapping("/company/{companyId}")
    public Page<ReviewDto> getReviewsByCompany(@PathVariable Long companyId,
                                               @RequestParam(defaultValue = "0") int page,
                                               @RequestParam(defaultValue = "10") int size) {
        return reviewAdminService.getReviewsByCompanyId(companyId, PageRequest.of(page, size));
    }

    /** 리뷰 삭제 */
    @DeleteMapping("/{id}")
    public void deleteReview(@PathVariable Long id) {
        reviewAdminService.deleteReview(id);
    }

    /** 리뷰 수정 */
    @PutMapping("/{id}")
    public ReviewDto updateReview(@PathVariable Long id, @RequestBody ReviewDto dto) {
        Review updateData = Review.builder()
                .score(dto.getScore())
                .content(dto.getContent())
                .build();
        return reviewAdminService.updateReviewDto(id, updateData);
    }

    /** 리뷰 생성 */
    @PostMapping
    public ReviewDto createReview(@RequestBody ReviewDto dto) {
        Review review = Review.builder()
                .score(dto.getScore())
                .content(dto.getContent())
                .build();
        return reviewAdminService.createReviewDto(review);
    }
}
