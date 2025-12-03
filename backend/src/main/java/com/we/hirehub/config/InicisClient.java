package com.we.hirehub.config;

import com.we.hirehub.dto.support.InicisResponseDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.util.Base64;
import java.util.HashMap;
import java.util.Map;

@Component
@RequiredArgsConstructor
@Slf4j
public class InicisClient {

    @Value("${inicis.mid}")
    private String mid;

    @Value("${inicis.sign-key}")
    private String signKey;

    @Value("${inicis.api-url}")
    private String apiUrl;

    private final RestTemplate restTemplate = new RestTemplate();

    public InicisResponseDto requestReady(Integer amount, String goodName, String orderNumber) {

        String timestamp = now();
        String signature = makeSignature(orderNumber, amount.toString(), timestamp);

        Map<String, Object> body = new HashMap<>();
        body.put("type", "Pay");
        body.put("paymethod", "Card");
        body.put("timestamp", timestamp);
        body.put("clientIp", "127.0.0.1");
        body.put("mid", mid);
        body.put("goodname", goodName);
        body.put("oid", orderNumber);
        body.put("price", amount.toString());
        body.put("signature", signature);

        log.info("🔥 [Inicis READY 요청 시작]");
        log.info("➡️ 요청 URL = {}/ready", apiUrl);
        log.info("➡️ 요청 바디 = {}", body);

        return restTemplate.postForObject(
                apiUrl + "/ready",
                body,
                InicisResponseDto.class
        );
    }

    public InicisResponseDto requestApprove(String tid, String authToken, String orderNumber) {

        String timestamp = now();
        String signature = makeSignature(orderNumber, authToken, timestamp);

        Map<String, Object> body = new HashMap<>();
        body.put("tid", tid);
        body.put("authToken", authToken);
        body.put("mid", mid);
        body.put("oid", orderNumber);
        body.put("timestamp", timestamp);
        body.put("signature", signature);

        return restTemplate.postForObject(
                apiUrl + "/approve",
                body,
                InicisResponseDto.class
        );
    }

    public InicisResponseDto requestCancel(String tid, Integer amount, String reason) {

        String timestamp = now();
        String signature = makeSignature(tid, amount.toString(), timestamp);

        Map<String, Object> body = new HashMap<>();
        body.put("tid", tid);
        body.put("cancelMsg", reason);
        body.put("price", amount.toString());
        body.put("timestamp", timestamp);
        body.put("signature", signature);
        body.put("mid", mid);

        return restTemplate.postForObject(
                apiUrl + "/cancel",
                body,
                InicisResponseDto.class
        );
    }

    private String makeSignature(String key1, String key2, String timestamp) {
        String data = "oid=" + key1 + "&price=" + key2 + "&timestamp=" + timestamp;

        try {
            SecretKeySpec key = new SecretKeySpec(signKey.getBytes("UTF-8"), "HmacSHA256");
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(key);

            byte[] raw = mac.doFinal(data.getBytes("UTF-8"));
            return Base64.getEncoder().encodeToString(raw);

        } catch (Exception e) {
            throw new RuntimeException("SIGN ERROR", e);
        }
    }

    private String now() {
        return String.valueOf(System.currentTimeMillis());
    }
}
