package com.we.hirehub.service;

import com.we.hirehub.dto.ReviewDto;
import com.we.hirehub.entity.Company;
import com.we.hirehub.entity.Review;
import com.we.hirehub.entity.Users;
import com.we.hirehub.repository.CompanyRepository;
import com.we.hirehub.repository.ReviewRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ReviewService {

    private final ReviewRepository reviewRepository;
    private final CompanyRepository companyRepository;

    /**
     * ✅ 리뷰 등록 (JWT 로그인 유저 기반)
     * usersId는 프론트에서 받지 않고, SecurityContext에서 가져온 Users 엔티티를 직접 사용
     */
    @Transactional
    public Review addReview(ReviewDto dto, Users user) {
        // 회사 정보 조회
        Company company = companyRepository.findById(dto.getCompanyId())
                .orElseThrow(() -> new RuntimeException("회사 정보가 존재하지 않습니다."));

        // 리뷰 생성
        Review review = Review.builder()
                .score(dto.getScore())
                .content(dto.getContent())
                .users(user)
                .company(company)
                .build();

        return reviewRepository.save(review);
    }

    /** 전체 리뷰 조회 */
    public List<ReviewDto> getAllReviews() {
        return reviewRepository.findAll().stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    /** 특정 회사 리뷰 조회 */
    public List<ReviewDto> getReviewsByCompany(Long companyId) {
        return reviewRepository.findByCompanyId(companyId).stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    /** 특정 회사의 평균 별점 조회 */
    public Double getAverageScore(Long companyId) {
        Double avg = reviewRepository.findAverageScoreByCompanyId(companyId);
        return avg != null ? Math.round(avg * 10) / 10.0 : 0.0; // 소수점 1자리 반올림
    }

    /** 엔티티 → DTO 변환 */
    private ReviewDto convertToDto(Review review) {
        return ReviewDto.builder()
                .id(review.getId())
                .score(review.getScore())
                .content(review.getContent())
                .usersId(review.getUsers().getId())
                .nickname(review.getUsers().getNickname())
                .companyId(review.getCompany().getId())
                .build();
    }
}
