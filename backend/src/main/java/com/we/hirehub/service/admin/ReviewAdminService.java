package com.we.hirehub.service.admin;

import com.we.hirehub.entity.Review;
import com.we.hirehub.repository.ReviewRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ReviewAdminService {

    private final ReviewRepository reviewRepository;

    // ============ 조회 ============

    public Page<Review> getAllReviews(Pageable pageable) {
        log.debug("모든 리뷰 조회");
        return reviewRepository.findAll(pageable);
    }

    public Review getReviewById(Long reviewId) {
        log.debug("리뷰 조회: {}", reviewId);
        return reviewRepository.findById(reviewId)
                .orElseThrow(() -> new IllegalArgumentException("리뷰를 찾을 수 없습니다: " + reviewId));
    }

    public Page<Review> getReviewsByCompanyId(Long companyId, Pageable pageable) {
        log.info("기업별 리뷰 조회: {}", companyId);
        return reviewRepository.findByCompanyId(companyId, pageable);
    }
    // ============ 생성 ============

    @Transactional
    public Review createReview(Review review) {
        log.info("리뷰 생성");
        validateReviewScore(review);
        return reviewRepository.save(review);
    }

    // ============ 수정 ============

    @Transactional
    public Review updateReview(Long reviewId, Review updateData) {
        log.info("리뷰 수정: {}", reviewId);
        Review review = getReviewById(reviewId);

        if (updateData.getScore() != null) {
            validateScore(updateData.getScore());
            review.setScore(updateData.getScore());
        }
        if (updateData.getContent() != null) review.setContent(updateData.getContent());

        return reviewRepository.save(review);
    }

    // ============ 삭제 ============

    @Transactional
    public void deleteReview(Long reviewId) {
        log.info("리뷰 삭제: {}", reviewId);
        if (!reviewRepository.existsById(reviewId)) {
            throw new IllegalArgumentException("존재하지 않는 리뷰입니다");
        }
        reviewRepository.deleteById(reviewId);
    }
    // ============ 유효성 검사 ============

    private void validateReviewScore(Review review) {
        if (review.getScore() == null) {
            throw new IllegalArgumentException("평점이 필요합니다");
        }
        validateScore(review.getScore());
    }

    private void validateScore(Long score) {
        if (score < 1 || score > 5) {
            throw new IllegalArgumentException("평점은 1~5 사이의 값이어야 합니다");
        }
    }
}