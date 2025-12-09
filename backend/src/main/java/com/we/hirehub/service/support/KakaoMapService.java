package com.we.hirehub.service.support;

import com.we.hirehub.config.KakaoMapClient;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class KakaoMapService {

    private final KakaoMapClient kakaoMapClient;

    /**
     * 주소 → 위도/경도 변환 (Geocoding)
     * 기존 Company 서비스, JobPost 서비스 모두 LatLngResponse 사용하므로
     * 절대 double[] 로 리턴하면 안 됨.
     */
    public KakaoMapClient.LatLngResponse getLatLngFromAddress(String address) {

        try {
            if (address == null || address.isBlank()) {
                log.warn("⚠️ 빈 주소로 요청됨. address={}", address);
                return null;
            }

            KakaoMapClient.LatLngResponse res = kakaoMapClient.getLatLng(address);

            if (res == null) {
                log.warn("⚠️ KakaoMapClient 반환값 null. address={}", address);
                return null;
            }

            log.info("📍 주소 '{}' → lat={}, lng={}", address, res.getLat(), res.getLng());
            return res;

        } catch (Exception e) {
            log.error("❌ 카카오맵 Geocoding 실패 - address={}", address, e);
            return null;
        }
    }
}
