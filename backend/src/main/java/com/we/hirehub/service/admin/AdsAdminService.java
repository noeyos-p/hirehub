package com.we.hirehub.service.admin;

import com.we.hirehub.dto.support.AdsResponseDto;
import com.we.hirehub.entity.Ads;
import com.we.hirehub.repository.AdsRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class AdsAdminService {

    private final AdsRepository adsRepository;

    /** 광고 생성 */
    public AdsResponseDto createAd(String photoUrl) {
        Ads ad = Ads.create(photoUrl);
        Ads saved = adsRepository.save(ad);
        log.info("🆕 새 광고 생성 완료 - id={}, photo={}", saved.getId(), saved.getPhoto());
        return new AdsResponseDto(saved.getId(), saved.getPhoto());
    }

    /** 광고 사진 업데이트 */
    public AdsResponseDto updateAdPhoto(Long adId, String photoUrl) {
        Ads ad = adsRepository.findById(adId)
                .orElseThrow(() -> new IllegalArgumentException("해당 광고를 찾을 수 없습니다. adId=" + adId));

        ad.updatePhoto(photoUrl);     // Setter 제거하고 엔티티 메서드 사용

        Ads updated = adsRepository.save(ad);
        log.info("🔁 광고 사진 업데이트 완료 - id={}, photo={}", adId, photoUrl);

        return new AdsResponseDto(updated.getId(), updated.getPhoto());
    }

    /** 광고 전체 조회 */
    public List<AdsResponseDto> getAllAds() {
        return adsRepository.findAll()
                .stream()
                .map(ad -> new AdsResponseDto(ad.getId(), ad.getPhoto()))
                .toList();
    }

    /** 광고 완전 삭제 */
    public void deleteAd(Long adId) {
        Ads ad = adsRepository.findById(adId)
                .orElseThrow(() -> new IllegalArgumentException("해당 광고를 찾을 수 없습니다. adId=" + adId));
        adsRepository.delete(ad);
        log.info("🗑️ 광고 완전 삭제 완료 - id={}", adId);
    }
}
