package com.we.hirehub.service.admin;

import com.we.hirehub.dto.ReviewDto;
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

    public Page<ReviewDto> getAllReviews(Pageable pageable) {
        log.debug("모든 리뷰 조회 (DTO 반환)");
        return reviewRepository.findAll(pageable)
                .map(this::convertToDto);
    }

    public ReviewDto getReviewByIdDto(Long reviewId) {
        log.debug("리뷰 조회 (DTO): {}", reviewId);
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new IllegalArgumentException("리뷰를 찾을 수 없습니다: " + reviewId));
        return convertToDto(review);
    }

    public Page<ReviewDto> getReviewsByCompanyId(Long companyId, Pageable pageable) {
        log.info("기업별 리뷰 조회 (DTO): {}", companyId);
        return reviewRepository.findByCompanyId(companyId, pageable)
                .map(this::convertToDto);
    }

    // ============ 생성 ============

    @Transactional
    public Review createReview(Review review) {
        log.info("리뷰 생성");
        validateReviewScore(review);
        return reviewRepository.save(review);
    }

    @Transactional
    public ReviewDto createReviewDto(Review review) {
        Review saved = createReview(review);
        return convertToDto(saved);
    }

    // ============ 수정 ============

    @Transactional
    public Review updateReview(Long reviewId, Review updateData) {
        log.info("리뷰 수정: {}", reviewId);
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new IllegalArgumentException("리뷰를 찾을 수 없습니다"));

        if (updateData.getScore() != null) {
            validateScore(updateData.getScore());
            review.setScore(updateData.getScore());
        }
        if (updateData.getContent() != null) review.setContent(updateData.getContent());

        return reviewRepository.save(review);
    }

    @Transactional
    public ReviewDto updateReviewDto(Long reviewId, Review updateData) {
        Review updated = updateReview(reviewId, updateData);
        return convertToDto(updated);
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

    // ============ 엔티티 → DTO 변환 ============

    private ReviewDto convertToDto(Review review) {
        return ReviewDto.builder()
                .id(review.getId())
                .score(review.getScore())
                .content(review.getContent())
                .usersId(review.getUsers() != null ? review.getUsers().getId() : null)
                .nickname(review.getUsers() != null ? review.getUsers().getNickname() : "익명")
                .companyId(review.getCompany() != null ? review.getCompany().getId() : null)
                .build();
    }
}
