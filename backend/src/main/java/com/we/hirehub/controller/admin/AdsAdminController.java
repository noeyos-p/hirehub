package com.we.hirehub.controller.admin;

import com.we.hirehub.dto.support.AdsDto;
import com.we.hirehub.entity.Ads;
import com.we.hirehub.service.admin.AdsAdminService;
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

            // ★ 엔티티 대신 DTO로 변환 (응답 구조 그대로)
            List<AdsDto> dtoList = adsList.stream()
                    .map(AdsDto::toDto)
                    .toList();

            log.info("📋 광고 {}개 조회됨", dtoList.size());

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "광고 목록 조회 성공");
            response.put("data", dtoList); // 기존 key 그대로 사용

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("❌ 광고 목록 조회 실패", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(error("광고 목록 조회 실패: " + e.getMessage()));
        }
    }

    /** ✅ 광고 생성 + 이미지 업로드 */
    @PostMapping("/ad-image")
    public ResponseEntity<Map<String, Object>> uploadAdImage(
            @RequestParam(value = "adId", required = false) Long adId,
            @RequestParam("file") MultipartFile file) {

        try {
            log.info("📤 광고 업로드 요청 - adId: {}, file: {}", adId, file.getOriginalFilename());

            // S3 업로드
            String fileUrl = s3Service.uploadAdImage(file, adId != null ? adId : 0L);

            Ads savedAd;
            if (adId == null || adId == 0) {
                savedAd = adsAdminService.createAd(fileUrl);
            } else {
                savedAd = adsAdminService.updateAdPhoto(adId, fileUrl);
            }

            // ★ 엔티티 → DTO
            AdsDto dto = AdsDto.toDto(savedAd);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "광고 업로드 성공");
            response.put("fileUrl", fileUrl);  // 기존 key 유지
            response.put("adId", dto.getId());
            response.put("photo", dto.getPhoto());
            response.put("data", dto); // 추가된 DTO 전달

            return ResponseEntity.ok(response);

        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(error(e.getMessage()));

        } catch (Exception e) {
            log.error("❌ 업로드 실패", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(error("업로드 실패: " + e.getMessage()));
        }
    }

    /** ✅ 광고 삭제 */
    @DeleteMapping("/file")
    public ResponseEntity<Map<String, Object>> deleteFile(
            @RequestParam("fileUrl") String fileUrl,
            @RequestParam(value = "adId", required = false) Long adId) {

        try {
            log.info("🗑️ 광고 삭제 요청 - adId={}, fileUrl={}", adId, fileUrl);

            s3Service.deleteFile(fileUrl);

            if (adId != null && adId > 0) {
                adsAdminService.deleteAd(adId);
            }

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "광고 및 이미지 삭제 성공");
            response.put("deletedUrl", fileUrl);

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("❌ 광고 삭제 실패", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(error("삭제 실패: " + e.getMessage()));
        }
    }

    private Map<String, Object> error(String message) {
        Map<String, Object> m = new HashMap<>();
        m.put("success", false);
        m.put("message", message);
        return m;
    }
}
