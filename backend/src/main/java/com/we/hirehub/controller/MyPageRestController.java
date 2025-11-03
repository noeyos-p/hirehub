package com.we.hirehub.controller;// MyPageRestController.java의 userId() 메서드만 교체

import com.we.hirehub.dto.*;
import com.we.hirehub.service.JobPostScrapService;
import com.we.hirehub.service.MyPageService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@Slf4j
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

        log.debug("🔍 Principal 분석: 타입={}, 값={}",
                p != null ? p.getClass().getSimpleName() : "null", p);

        // 1️⃣ JwtUserPrincipal (JWT 방식)
        if (p instanceof com.we.hirehub.config.JwtUserPrincipal jwt) {
            Long userId = jwt.getUserId();
            log.debug("✅ JwtUserPrincipal에서 userId 추출: {}", userId);
            return userId;
        }

        // 2️⃣ OAuth2User (OAuth2 방식) - 중요!
        if (p instanceof OAuth2User oauth2User) {
            log.debug("🔑 OAuth2User 분석 - Attributes: {}", oauth2User.getAttributes());

            // id 또는 uid에서 userId 추출
            Object idObj = oauth2User.getAttribute("id");
            if (idObj == null) {
                idObj = oauth2User.getAttribute("uid");
            }

            if (idObj != null) {
                Long userId = convertToLong(idObj);
                if (userId != null) {
                    log.debug("✅ OAuth2User에서 userId 추출: {}", userId);
                    return userId;
                }
            }

            log.warn("⚠️ OAuth2User에서 id/uid를 찾을 수 없음");
        }

        // 3️⃣ Long (직접 ID)
        if (p instanceof Long l) {
            log.debug("✅ Long으로부터 userId 추출: {}", l);
            return l;
        }

        // 4️⃣ String (이메일/ID 문자열)
        if (p instanceof String s) {
            try {
                Long userId = Long.parseLong(s);
                log.debug("✅ String으로부터 userId 파싱: {}", userId);
                return userId;
            } catch (NumberFormatException ignored) {
                log.debug("⚠️ String을 Long으로 파싱 실패: {}", s);
            }
        }

        // 5️⃣ Spring Security User (일반 로그인)
        if (p instanceof org.springframework.security.core.userdetails.User user) {
            try {
                Long userId = Long.parseLong(user.getUsername());
                log.debug("✅ User(username)으로부터 userId 추출: {}", userId);
                return userId;
            } catch (NumberFormatException ignored) {
                log.debug("⚠️ User username을 Long으로 파싱 실패: {}", user.getUsername());
            }
        }

        // 6️⃣ 리플렉션으로 getId() 메서드 시도
        try {
            var m = p.getClass().getMethod("getId");
            Object v = m.invoke(p);
            if (v instanceof Long l) {
                log.debug("✅ 리플렉션 getId()로부터 userId 추출: {}", l);
                return l;
            }
            if (v instanceof String s) {
                Long userId = Long.parseLong(s);
                log.debug("✅ 리플렉션 getId()로부터 userId 파싱: {}", userId);
                return userId;
            }
        } catch (Exception ignored) {
            log.debug("⚠️ 리플렉션 getId() 실패");
        }

        log.error("❌ 모든 방법 실패 - Principal: {}", p);
        throw new IllegalStateException("현재 사용자 ID를 확인할 수 없습니다.");
    }

    /**
     * Object를 Long으로 변환하는 헬퍼 메서드
     */
    private Long convertToLong(Object obj) {
        if (obj instanceof Number n) {
            return n.longValue();
        }
        if (obj instanceof String s) {
            try {
                return Long.parseLong(s);
            } catch (NumberFormatException ignored) {}
        }
        return null;
    }

    // ========== 이하 기존 메서드들 그대로 유지 ==========

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

    public record ApplyRequest(
            Long jobPostId,
            Long resumeId
    ) {}

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

    /**db삭제기능 */
    @DeleteMapping("/withdraw")
    public ResponseEntity<?> withdraw(Authentication auth) {
        if (auth == null || auth.getName() == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "UNAUTHORIZED", "message", "로그인이 필요합니다."));
        }

        String email = auth.getName();

        try {
            boolean deleted = myPageService.withdrawUser(email);
            if (deleted) {
                return ResponseEntity.ok(Map.of("message", "회원 탈퇴가 완료되었습니다."));
            } else {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("message", "회원 정보를 찾을 수 없습니다."));
            }
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "서버 오류로 탈퇴를 완료하지 못했습니다."));
        }
    }
}