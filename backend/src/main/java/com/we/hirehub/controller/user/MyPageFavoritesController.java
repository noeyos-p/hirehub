package com.we.hirehub.controller.user;

import com.we.hirehub.dto.common.PagedResponse;
import com.we.hirehub.dto.user.FavoriteDto;
import com.we.hirehub.service.support.JobPostScrapService;
import com.we.hirehub.service.user.MyPageFavoritesService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/mypage")
public class MyPageFavoritesController extends BaseUserController {

    private final MyPageFavoritesService myPageFavoritesService;
    private final JobPostScrapService jobPostScrapService;


    /**
     * ✅ 즐겨찾기 추가 (기업)
     */
    @PostMapping("/favorites/companies/{companyId}")
    public ResponseEntity<FavoriteDto.FavoriteCompanyDto> addFavoriteCompany(
            Authentication auth,
            @PathVariable Long companyId
    ) {
        FavoriteDto.FavoriteCompanyDto dto = myPageFavoritesService.addFavoriteCompany(userId(auth), companyId);
        return ResponseEntity.ok(dto);
    }

    /**
     * ✅ 즐겨찾기 목록 조회 (기업)
     */
    @GetMapping("/favorites/companies")
    public PagedResponse<FavoriteDto.FavoriteCompanyDto> favoriteCompanies(Authentication auth,
                                                                           @RequestParam(defaultValue = "0") int page,
                                                                           @RequestParam(defaultValue = "10") int size) {
        return myPageFavoritesService.listFavoriteCompanies(userId(auth), page, size);
    }

    /**
     * ✅ 즐겨찾기 삭제 (기업)
     */
    @DeleteMapping("/favorites/companies/{companyId}")
    public ResponseEntity<Void> removeFavoriteCompany(Authentication auth, @PathVariable Long companyId) {
        myPageFavoritesService.removeFavoriteCompany(userId(auth), companyId);
        return ResponseEntity.noContent().build();
    }

    /**
     * ✅ 스크랩 추가 (공고)
     */
    @PostMapping("/favorites/jobposts/{jobPostId}")
    public ResponseEntity<FavoriteDto.ScrapPostsDto> addScrapJobPost(
            Authentication auth,
            @PathVariable Long jobPostId
    ) {
        FavoriteDto.ScrapPostsDto dto = jobPostScrapService.add(userId(auth), jobPostId);
        return ResponseEntity.ok(dto);
    }

    /**
     * ✅ 스크랩 목록 조회 (공고)
     */
    @GetMapping("/favorites/jobposts")
    public PagedResponse<FavoriteDto.ScrapPostsDto> scrapJobPosts(
            Authentication auth,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        return jobPostScrapService.list(userId(auth), page, size);
    }

    /**
     * ✅ 스크랩 삭제 (공고)
     */
    @DeleteMapping("/favorites/jobposts/{jobPostId}")
    public ResponseEntity<Void> removeScrapJobPost(Authentication auth, @PathVariable Long jobPostId) {
        jobPostScrapService.remove(userId(auth), jobPostId);
        return ResponseEntity.noContent().build();
    }
}