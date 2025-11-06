package com.we.hirehub.controller;

import com.we.hirehub.entity.Ads;
import com.we.hirehub.service.AdsAdminService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 일반 사용자용 - 광고 조회 컨트롤러
 */
@Slf4j
@RestController
@RequestMapping("/api/ads")
@RequiredArgsConstructor
public class AdsController {

    private final AdsAdminService adsAdminService;

    /** ✅ 광고 전체 조회 (인증 불필요) */
    @GetMapping
    public ResponseEntity<Map<String, Object>> getAllAds() {
        try {
            List<Ads> adsList = adsAdminService.getAllAds();
            log.info("📋 일반 사용자 광고 {}개 조회됨", adsList.size());

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "광고 목록 조회 성공");
            response.put("data", adsList);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("❌ 광고 목록 조회 실패", e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "광고 목록 조회 실패: " + e.getMessage());
            return ResponseEntity.status(500).body(errorResponse);
        }
    }
}
