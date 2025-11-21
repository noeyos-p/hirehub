package com.we.hirehub.service.admin;

import com.we.hirehub.dto.support.AdsDto;
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
    public Ads createAd(String photoUrl) {
        Ads ad = new Ads();
        ad.setPhoto(photoUrl);
        return adsRepository.save(ad);
    }

    /** 광고 사진 업데이트 */
    public Ads updateAdPhoto(Long adId, String photoUrl) {
        Ads ad = adsRepository.findById(adId)
                .orElseThrow(() -> new IllegalArgumentException("해당 광고를 찾을 수 없습니다. adId=" + adId));
        ad.setPhoto(photoUrl);
        return adsRepository.save(ad);
    }

    /** 광고 전체 조회 */
    public List<Ads> getAllAds() {
        return adsRepository.findAll();
    }

    /** 광고 완전 삭제 */
    public void deleteAd(Long adId) {
        Ads ad = adsRepository.findById(adId)
                .orElseThrow(() -> new IllegalArgumentException("해당 광고를 찾을 수 없습니다. adId=" + adId));
        adsRepository.delete(ad);
    }
}
