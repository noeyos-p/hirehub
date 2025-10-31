package com.we.hirehub.controller;

import com.we.hirehub.dto.*;
import com.we.hirehub.service.JobPostScrapService;
import com.we.hirehub.service.MyPageService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * ✅ 마이페이지 REST 컨트롤러
 * - 이력서 CRUD
 * - 내 프로필 조회 및 수정
 * - 지원내역 조회
 * - 즐겨찾기(기업/공고) 관리
 */
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/mypage")
@CrossOrigin(origins = "http://localhost:3000", allowCredentials = "true")
public class MyPageRestController {

    private final MyPageService myPageService;
    private final JobPostScrapService jobPostScrapService;

    /* ==========================================================
       =============== [공통 유틸: 사용자 ID 추출] ===============
       ========================================================== */

    private Long userId(Authentication auth) {
        if (auth == null) {
            auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth == null)
                throw new IllegalStateException("인증 정보가 없습니다.");
        }
        Object p = auth.getPrincipal();
        if (p instanceof Long l) return l;
        if (p instanceof String s) {
            try {
                return Long.parseLong(s);
            } catch (NumberFormatException ignore) {}
        }
        try {
            var m = p.getClass().getMethod("getId");
            Object v = m.invoke(p);
            if (v instanceof Long l) return l;
            if (v instanceof String s) return Long.parseLong(s);
        } catch (Exception ignore) {}
        throw new IllegalStateException("현재 사용자 ID를 확인할 수 없습니다.");
    }

    /* ==========================================================
       =============== [1] 이력서 CRUD API ===============
       ========================================================== */

    /** ✅ 이력서 목록 조회 */
    @GetMapping("/resumes")
    public PagedResponse<ResumeDto> list(Authentication auth,
                                         @RequestParam(defaultValue = "0") int page,
                                         @RequestParam(defaultValue = "10") int size) {
        return myPageService.list(userId(auth), page, size);
    }

    /** ✅ 이력서 상세 조회 (온보딩 정보 포함됨) */
    @GetMapping("/resumes/{resumeId}")
    public ResumeDto get(Authentication auth, @PathVariable Long resumeId) {
        // ⚠️ 이 반환값에는 MyPageService.toDto()에서 profile 정보가 포함됨
        return myPageService.get(userId(auth), resumeId);
    }

    /** ✅ 이력서 생성 */
    @PostMapping("/resumes")
    public ResumeDto create(Authentication auth, @Valid @RequestBody ResumeUpsertRequest req) {
        return myPageService.create(userId(auth), req);
    }

    /** ✅ 이력서 수정 */
    @PutMapping("/resumes/{resumeId}")
    public ResumeDto update(Authentication auth,
                            @PathVariable Long resumeId,
                            @Valid @RequestBody ResumeUpsertRequest req) {
        return myPageService.update(userId(auth), resumeId, req);
    }

    /** ✅ 이력서 삭제 */
    @DeleteMapping("/resumes/{resumeId}")
    public ResponseEntity<Void> delete(Authentication auth, @PathVariable Long resumeId) {
        myPageService.delete(userId(auth), resumeId);
        return ResponseEntity.noContent().build();
    }

    /* ==========================================================
       =============== [2] 내 프로필 (온보딩) API ===============
       ========================================================== */

    /** ✅ 내 프로필 조회 (온보딩 데이터) */
    @GetMapping("/me")
    public ResponseEntity<MyProfileDto> getMe(Authentication auth) {
        return ResponseEntity.ok(myPageService.getProfile(userId(auth)));
    }

    /** ✅ 내 프로필 수정 */
    @PutMapping("/me")
    public ResponseEntity<MyProfileDto> updateMe(Authentication auth,
                                                 @Valid @RequestBody MyProfileUpdateRequest req) {
        return ResponseEntity.ok(myPageService.updateProfile(userId(auth), req));
    }

    /* ==========================================================
       =============== [3] 지원내역 API ===============
       ========================================================== */

    /** ✅ 내가 지원한 공고 내역 조회 */
    @GetMapping("/applies")
    public ResponseEntity<List<ApplyResponse>> getMyApplies(Authentication auth) {
        return ResponseEntity.ok(myPageService.getMyApplyList(userId(auth)));
    }

    /** ✅ 특정 공고에 지원 (이력서 선택) */
    @PostMapping("/applies")
    public ResponseEntity<ApplyResponse> applyToJob(
            Authentication auth,
            @RequestBody ApplyRequest request
    ) {
        ApplyResponse response = myPageService.applyToJob(
                userId(auth),
                request.jobPostId(),
                request.resumeId()
        );
        return ResponseEntity.ok(response);
    }

    /** DTO 내부 record: 지원 요청용 */
    public record ApplyRequest(
            Long jobPostId,
            Long resumeId
    ) {}

    /* ==========================================================
       =============== [4] 기업 즐겨찾기 CRUD API ===============
       ========================================================== */

    /** ✅ 즐겨찾기 추가 (기업) */
    @PostMapping("/favorites/companies/{companyId}")
    public ResponseEntity<FavoriteCompanySummaryDto> addFavoriteCompany(
            Authentication auth,
            @PathVariable Long companyId
    ) {
        FavoriteCompanySummaryDto dto = myPageService.addFavoriteCompany(userId(auth), companyId);
        return ResponseEntity.ok(dto);
    }

    /** ✅ 즐겨찾기 목록 조회 (기업) */
    @GetMapping("/favorites/companies")
    public PagedResponse<FavoriteCompanySummaryDto> favoriteCompanies(Authentication auth,
                                                                      @RequestParam(defaultValue = "0") int page,
                                                                      @RequestParam(defaultValue = "10") int size) {
        return myPageService.listFavoriteCompanies(userId(auth), page, size);
    }

    /** ✅ 즐겨찾기 삭제 (기업) */
    @DeleteMapping("/favorites/companies/{companyId}")
    public ResponseEntity<Void> removeFavoriteCompany(Authentication auth, @PathVariable Long companyId) {
        myPageService.removeFavoriteCompany(userId(auth), companyId);
        return ResponseEntity.noContent().build();
    }

    /* ==========================================================
       =============== [5] 공고 스크랩 CRUD API ===============
       ========================================================== */

    /** ✅ 스크랩 추가 (공고) */
    @PostMapping("/favorites/jobposts/{jobPostId}")
    public ResponseEntity<FavoriteJobPostSummaryDto> addScrapJobPost(
            Authentication auth,
            @PathVariable Long jobPostId
    ) {
        FavoriteJobPostSummaryDto dto = jobPostScrapService.add(userId(auth), jobPostId);
        return ResponseEntity.ok(dto);
    }

    /** ✅ 스크랩 목록 조회 (공고) */
    @GetMapping("/favorites/jobposts")
    public PagedResponse<FavoriteJobPostSummaryDto> scrapJobPosts(
            Authentication auth,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        return jobPostScrapService.list(userId(auth), page, size);
    }

    /** ✅ 스크랩 삭제 (공고) */
    @DeleteMapping("/favorites/jobposts/{jobPostId}")
    public ResponseEntity<Void> removeScrapJobPost(Authentication auth, @PathVariable Long jobPostId) {
        jobPostScrapService.remove(userId(auth), jobPostId);
        return ResponseEntity.noContent().build();
    }
}
