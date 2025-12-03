package com.we.hirehub.service.support;

import com.we.hirehub.config.KakaoMapClient;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class KakaoMapService {

    private final KakaoMapClient kakaoMapClient;

    public KakaoMapClient.LatLngResponse getLatLngFromAddress(String address) {
        return kakaoMapClient.getLatLng(address);
    }
}
