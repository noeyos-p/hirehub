package com.we.hirehub.controller;

import com.we.hirehub.dto.PagedResponse;
import com.we.hirehub.dto.ReviewDto;
import com.we.hirehub.entity.Company;
import com.we.hirehub.entity.Review;
import com.we.hirehub.entity.Users;
import com.we.hirehub.repository.CompanyRepository;
import com.we.hirehub.repository.UsersRepository;
import com.we.hirehub.service.ReviewService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

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
        // ✅ 로그인 사용자 ID 추출
        Long userId = Long.parseLong(authentication.getName());

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

    /** ✅ 관리자용 페이징/정렬된 리뷰 조회 */
    @GetMapping("/admin")
    public ResponseEntity<PagedResponse<ReviewDto>> getReviewsForAdmin(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "id") String sortBy,
            @RequestParam(defaultValue = "DESC") String direction
    ) {
        Sort.Direction sortDirection = direction.equalsIgnoreCase("ASC")
                ? Sort.Direction.ASC
                : Sort.Direction.DESC;
        Sort sort = Sort.by(sortDirection, sortBy);
        PageRequest pageable = PageRequest.of(page, size, sort);

        Page<ReviewDto> reviewPage = reviewService.getAllReviewsPaged(pageable);

        return ResponseEntity.ok(new PagedResponse<>(
                reviewPage.getContent(),
                reviewPage.getNumber(),
                reviewPage.getSize(),
                reviewPage.getTotalElements(),
                reviewPage.getTotalPages()
        ));
    }

    /** ✅ 특정 회사 리뷰 조회 */
    @GetMapping("/company/{companyName}")
    public ResponseEntity<List<ReviewDto>> getReviewsByCompany(@PathVariable String companyName) {
        List<Company> companies = companyRepository.findByName(companyName);
        if (companies.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Company company = companies.get(0);
        List<ReviewDto> reviews = reviewService.getReviewsByCompany(company.getId());
        return ResponseEntity.ok(reviews);
    }

    /** ✅ 특정 회사 평균 별점 조회 */
    @GetMapping("/company/{companyName}/average")
    public ResponseEntity<Double> getAverageScore(@PathVariable String companyName) {
        List<Company> companies = companyRepository.findByName(companyName);
        if (companies.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Company company = companies.get(0);
        Double avgScore = reviewService.getAverageScore(company.getId());
        return ResponseEntity.ok(avgScore);
    }

    /** ✅ 관리자용 리뷰 삭제 */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteReview(@PathVariable Long id) {
        reviewService.deleteReview(id);
        return ResponseEntity.noContent().build();
    }
}