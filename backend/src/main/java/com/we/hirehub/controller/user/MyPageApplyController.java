package com.we.hirehub.controller.user;

import com.we.hirehub.dto.user.ApplyDto;
import com.we.hirehub.service.user.MyPageApplyService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/mypage")
public class MyPageApplyController extends BaseUserController {

    private final MyPageApplyService myPageApplyService;


    /**
     * ✅ 내가 지원한 공고 내역 조회
     */
    @GetMapping("/applies")
    public ResponseEntity<List<ApplyDto>> getMyApplies(Authentication auth) {
        return ResponseEntity.ok(myPageApplyService.getMyApplyList(userId(auth)));
    }

    /**
     * ✅ 특정 공고에 지원 (이력서 선택)
     */
    @PostMapping("/applies")
    public ResponseEntity<ApplyDto> applyToJob(
            Authentication auth,
            @RequestBody ApplyRequest request
    ) {
        ApplyDto response = myPageApplyService.applyToJob(
                userId(auth),
                request.jobPostId(),
                request.resumeId()
        );
        return ResponseEntity.ok(response);
    }

    public record ApplyRequest(
            Long jobPostId,
            Long resumeId
    ) {
    }

    /**
     * ✅ 내가 지원한 공고 내역 삭제 (복수 ID 지원)
     */
    @DeleteMapping("/applies")
    public ResponseEntity<?> deleteMyApplies(
            Authentication auth,
            @RequestBody List<Long> applyIds
    ) {
        try {
            myPageApplyService.deleteMyApplies(userId(auth), applyIds);
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            log.error("❌ 지원 내역 삭제 중 오류 발생", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "지원 내역 삭제에 실패했습니다."));
        }
    }

    @PostMapping(value = "/resumes/{id}/photo", consumes = "multipart/form-data")
    public ResponseEntity<?> uploadResumePhoto(@PathVariable Long id,
                                               @RequestParam("file") MultipartFile file) {
        try {
            log.info("🔥 uploadResumePhoto 호출됨 - resumeId={}, file={}", id, file.getOriginalFilename());
            String photoUrl = myPageApplyService.uploadResumePhotoToS3(id, file);
            return ResponseEntity.ok(Map.of("url", photoUrl, "idPhoto", photoUrl));
        } catch (Exception e) {
            log.error("❌ 업로드 예외: {}", e.getMessage(), e);
            // 여기서 서버 내부 예외를 직접 반환
            return ResponseEntity.internalServerError()
                    .body(Map.of(
                            "error", e.getClass().getSimpleName(),
                            "message", e.getMessage()
                    ));
        }
    }
}