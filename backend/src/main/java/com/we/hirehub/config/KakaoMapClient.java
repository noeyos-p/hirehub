package com.we.hirehub.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

@Slf4j
@Component
@RequiredArgsConstructor
public class KakaoMapClient {

    private final KakaoMapConfig config;
    private final RestTemplate restTemplate;

    private static final String KAKAO_LOCAL_SEARCH_URL =
            "https://dapi.kakao.com/v2/local/search/address.json?query={query}";

    public LatLngResponse getLatLng(String address) {
        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", "KakaoAK " + config.getKakaoRestApiKey());
        HttpEntity<Void> entity = new HttpEntity<>(headers);

        ResponseEntity<KakaoAddressResponse> response =
                restTemplate.exchange(
                        KAKAO_LOCAL_SEARCH_URL,
                        HttpMethod.GET,
                        entity,
                        KakaoAddressResponse.class,
                        address
                );

        KakaoAddressResponse body = response.getBody();

        if (body == null || body.getDocuments() == null || body.getDocuments().isEmpty()) {
            throw new IllegalArgumentException("카카오 주소 검색 결과 없음: " + address);
        }

        KakaoAddressResponse.Document doc = body.getDocuments().get(0);

        return new LatLngResponse(
                Double.parseDouble(doc.getY()),
                Double.parseDouble(doc.getX())
        );
    }

    /** 내부 응답 DTO들 */
    @lombok.Data
    public static class KakaoAddressResponse {
        private java.util.List<Document> documents;

        @lombok.Data
        public static class Document {
            private String x; // 경도(Lng)
            private String y; // 위도(Lat)
        }
    }

    @lombok.Data
    public static class LatLngResponse {
        private final Double lat;
        private final Double lng;
    }
}
