package com.we.hirehub.controller.user;

import com.we.hirehub.dto.common.PagedResponse;
import com.we.hirehub.dto.user.ResumeDto;
import com.we.hirehub.dto.user.ResumeUpsertRequest;
import com.we.hirehub.service.user.MyPageResumeService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/mypage")
public class MyPageResumeController extends BaseUserController {

    private final MyPageResumeService myPageResumeService;


    /**
     * ✅ 이력서 목록 조회
     */
    @GetMapping("/resumes")
    public PagedResponse<ResumeDto> list(Authentication auth,
                                         @RequestParam(defaultValue = "0") int page,
                                         @RequestParam(defaultValue = "10") int size) {
        return myPageResumeService.list(userId(auth), page, size);
    }

    /**
     * ✅ 이력서 상세 조회 (온보딩 정보 포함됨)
     */
    @GetMapping("/resumes/{resumeId}")
    public ResumeDto get(Authentication auth, @PathVariable Long resumeId) {
        return myPageResumeService.get(userId(auth), resumeId);
    }

    /**
     * ✅ 이력서 생성
     */
    @PostMapping("/resumes")
    public ResumeDto create(Authentication auth, @Valid @RequestBody ResumeUpsertRequest req) {
        return myPageResumeService.create(userId(auth), req);
    }

    /**
     * ✅ 이력서 수정
     */
    @PutMapping("/resumes/{resumeId}")
    public ResumeDto update(Authentication auth,
                            @PathVariable Long resumeId,
                            @Valid @RequestBody ResumeUpsertRequest req) {
        return myPageResumeService.update(userId(auth), resumeId, req);
    }

    /**
     * ✅ 이력서 삭제
     */
    @DeleteMapping("/resumes/{resumeId}")
    public ResponseEntity<Void> delete(Authentication auth, @PathVariable Long resumeId) {
        myPageResumeService.delete(userId(auth), resumeId);
        return ResponseEntity.noContent().build();
    }
}
