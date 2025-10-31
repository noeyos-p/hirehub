package com.we.hirehub.controller.admin;

import com.we.hirehub.entity.Ads;
import com.we.hirehub.service.AdsAdminService;
import com.we.hirehub.service.S3Service;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 관리자 전용 - 광고 생성 및 이미지 업로드/삭제 컨트롤러
 */
@Slf4j
@RestController
@RequestMapping("/api/admin/ads-management")
@RequiredArgsConstructor
public class AdsAdminController {

    private final S3Service s3Service;
    private final AdsAdminService adsAdminService;

    /** ✅ 광고 전체 조회 */
    @GetMapping("/ads")
    public ResponseEntity<Map<String, Object>> getAllAds() {
        try {
            List<Ads> adsList = adsAdminService.getAllAds();
            log.info("📋 광고 {}개 조회됨", adsList.size());

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "광고 목록 조회 성공");
            response.put("data", adsList);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("❌ 광고 목록 조회 실패", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse("광고 목록 조회 실패: " + e.getMessage()));
        }
    }

    /** ✅ 광고 생성 + 이미지 업로드 */
    @PostMapping("/ad-image")
    public ResponseEntity<Map<String, Object>> uploadAdImage(
            @RequestParam(value = "adId", required = false) Long adId,
            @RequestParam("file") MultipartFile file) {

        try {
            log.info("📤 광고 업로드 요청 - adId: {}, file: {}", adId, file.getOriginalFilename());

            // 1️⃣ S3 업로드
            String fileUrl = s3Service.uploadAdImage(file, (adId != null) ? adId : 0L);
            log.info("✅ S3 업로드 완료: {}", fileUrl);

            // 2️⃣ DB 저장 (새로 생성 or 업데이트)
            Ads savedAd;
            if (adId == null || adId == 0) {
                savedAd = adsAdminService.createAd(fileUrl);
                log.info("🆕 새 광고 생성 완료 - id={}, photo={}", savedAd.getId(), savedAd.getPhoto());
            } else {
                savedAd = adsAdminService.updateAdPhoto(adId, fileUrl);
                log.info("🔁 광고 업데이트 완료 - id={}, photo={}", adId, fileUrl);
            }

            // 3️⃣ 응답
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "광고 업로드 성공");
            response.put("fileUrl", fileUrl);
            response.put("adId", savedAd.getId());
            response.put("photo", savedAd.getPhoto());

            return ResponseEntity.ok(response);

        } catch (IllegalArgumentException e) {
            log.error("⚠️ Validation error: {}", e.getMessage());
            return ResponseEntity.badRequest().body(createErrorResponse(e.getMessage()));

        } catch (Exception e) {
            log.error("❌ 업로드 실패", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse("업로드 실패: " + e.getMessage()));
        }
    }

    /** ✅ 광고 삭제 (S3 + DB 완전 삭제) */
    @DeleteMapping("/file")
    public ResponseEntity<Map<String, Object>> deleteFile(
            @RequestParam("fileUrl") String fileUrl,
            @RequestParam(value = "adId", required = false) Long adId) {

        try {
            log.info("🗑️ 광고 삭제 요청 - adId={}, fileUrl={}", adId, fileUrl);

            // 1️⃣ S3 파일 삭제
            s3Service.deleteFile(fileUrl);
            log.info("✅ S3 파일 삭제 완료: {}", fileUrl);

            // 2️⃣ DB 광고 완전 삭제
            if (adId != null && adId > 0) {
                adsAdminService.deleteAd(adId);
                log.info("✅ 광고 DB 삭제 완료 - adId={}", adId);
            }

            // 3️⃣ 응답
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "광고 및 이미지 삭제 성공");
            response.put("deletedUrl", fileUrl);

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("❌ 광고 삭제 실패", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse("삭제 실패: " + e.getMessage()));
        }
    }

    /** 공통 에러 응답 */
    private Map<String, Object> createErrorResponse(String message) {
        Map<String, Object> response = new HashMap<>();
        response.put("success", false);
        response.put("message", message);
        return response;
    }
}
