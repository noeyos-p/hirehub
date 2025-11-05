package com.we.hirehub.controller;

import com.we.hirehub.config.JwtUserPrincipal;
import com.we.hirehub.dto.ReviewDto;
import com.we.hirehub.entity.Company;
import com.we.hirehub.entity.Review;
import com.we.hirehub.entity.Users;
import com.we.hirehub.repository.CompanyRepository;
import com.we.hirehub.repository.UsersRepository;
import com.we.hirehub.service.ReviewService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/reviews")
@RequiredArgsConstructor
public class ReviewRestController {

    private final ReviewService reviewService;
    private final CompanyRepository companyRepository;
    private final UsersRepository usersRepository;

    /** ✅ 리뷰 등록 (로그인 사용자 자동 연결) */
    @PostMapping
    public ReviewDto createReview(@RequestBody ReviewDto dto, Authentication authentication) {
        System.out.println("DTO 내용: " + dto);
        System.out.println("Auth: " + authentication);
        // ✅ 로그인 사용자 ID 추출
        JwtUserPrincipal principal = (JwtUserPrincipal) authentication.getPrincipal();
        Long userId = principal.getUserId();

        // ✅ 사용자 조회
        Users user = usersRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("유저를 찾을 수 없습니다."));

        // ✅ 회사 ID 유효성 검사
        if (dto.getCompanyId() == null) {
            throw new IllegalArgumentException("회사 ID(companyId)가 null입니다.");
        }

        // ✅ 리뷰 저장
        Review saved = reviewService.addReview(dto, user);

        // ✅ 응답 DTO 반환
        return ReviewDto.builder()
                .id(saved.getId())
                .score(saved.getScore())
                .content(saved.getContent())
                .usersId(saved.getUsers().getId())
                .nickname(saved.getUsers().getNickname())
                .companyId(saved.getCompany().getId())
                .build();
    }

    /** ✅ 전체 리뷰 조회 */
    @GetMapping
    public List<ReviewDto> getAllReviews() {
        return reviewService.getAllReviews();
    }

    /** ✅ 특정 회사 리뷰 조회 */
    @GetMapping("/company/{companyId}")
    public ResponseEntity<List<ReviewDto>> getReviewsByCompany(@PathVariable Long companyId) {
        Company company = companyRepository.findById(companyId)
                .orElseThrow(() -> new RuntimeException("해당 회사를 찾을 수 없습니다."));

        List<ReviewDto> reviews = reviewService.getReviewsByCompany(company.getId());
        return ResponseEntity.ok(reviews);
    }

    /** ✅ 특정 회사 평균 별점 조회 */
    @GetMapping("/company/{companyId}/average")
    public ResponseEntity<Double> getAverageScore(@PathVariable Long companyId) {
        Company company = companyRepository.findById(companyId)
                .orElseThrow(() -> new RuntimeException("해당 회사를 찾을 수 없습니다."));

        Double avgScore = reviewService.getAverageScore(company.getId());
        return ResponseEntity.ok(avgScore);
    }
}
