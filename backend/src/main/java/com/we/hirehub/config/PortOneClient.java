package com.we.hirehub.config;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

@Slf4j
@Component
@RequiredArgsConstructor
public class PortOneClient {

    @Value("${portone.store-id}")
    private String storeId;

    @Value("${portone.api-secret}")
    private String apiSecret;

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper om = new ObjectMapper();

    public JsonNode getPayment(String impUid) {

        String url = "https://api.portone.io/payments/" + impUid;

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("Authorization", "PortOne " + apiSecret);
        headers.set("x-store-id", storeId);

        HttpEntity<String> entity = new HttpEntity<>(headers);

        log.info("🔍 PortOne 결제 조회 요청: {}", url);

        ResponseEntity<String> response =
                restTemplate.exchange(url, HttpMethod.GET, entity, String.class);

        log.info("📥 PortOne 응답: {}", response.getBody());

        try {
            return om.readTree(response.getBody());
        } catch (Exception e) {
            throw new RuntimeException("PortOne 응답 파싱 실패", e);
        }
    }
}
