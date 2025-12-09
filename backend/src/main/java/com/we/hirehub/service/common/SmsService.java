package com.we.hirehub.service.common;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.*;

@Slf4j
@Service
public class SmsService {

    @Value("${solapi.api-key}")
    private String API_KEY;

    @Value("${solapi.api-secret}")
    private String API_SECRET;

    @Value("${solapi.sender}")
    private String SENDER;

    /**
     * SMS 인증코드 발송
     * 
     * @param phone 수신자 전화번호
     * @param code  인증코드
     */
    public void sendCode(String phone, String code) {
        // 🔥 Mock Mode Check
        if (API_KEY == null || API_KEY.isBlank() || API_KEY.contains("test")
                || API_SECRET == null || API_SECRET.isBlank()) {
            log.warn("⚠️ [Mock SMS Mode] 실물 문자가 발송되지 않습니다. (API Key 미설정/Test 모드)");
            log.info("📨 [Mock Send] To: {}, Code: {}", phone, code);
            return; // 실제 발송 로직 건너뜀
        }

        String url = "https://api.coolsms.co.kr/messages/v4/send";

        try {
            // 1. ISO 8601 형식의 UTC 시간 생성
            String date = Instant.now().toString();

            // 2. 랜덤 salt 생성 (16바이트 hex = 32자)
            String salt = generateRandomSalt();

            // 3. Signature 생성 (date + salt를 데이터로, API_SECRET을 키로)
            String signature = createSignature(date, salt);

            log.info("🔐 SMS 인증 정보:");
            log.info("  - Date: {}", date);
            log.info("  - Salt: {}", salt);
            log.info("  - Signature: {}", signature);

            // 4. 요청 본문 구성 (단일 메시지)
            Map<String, String> message = new HashMap<>();
            message.put("to", phone);
            message.put("from", SENDER);
            message.put("text", "[HireHub] 인증번호: " + code);

            Map<String, Object> body = new HashMap<>();
            body.put("message", message);

            // 5. HTTP 헤더 구성
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("Authorization",
                    "HMAC-SHA256 apiKey=" + API_KEY +
                            ", date=" + date +
                            ", salt=" + salt +
                            ", signature=" + signature);

            // 6. RestTemplate으로 API 호출
            RestTemplate rest = new RestTemplate();
            HttpEntity<Object> entity = new HttpEntity<>(body, headers);

            log.info("📤 SMS 발송 요청:");
            log.info("  - URL: {}", url);
            log.info("  - 수신자: {}", phone);
            log.info("  - 인증코드: {}", code);

            ResponseEntity<String> response = rest.postForEntity(url, entity, String.class);

            log.info("✅ SMS 발송 성공!");
            log.info("  - 응답 코드: {}", response.getStatusCode());
            log.info("  - 응답 본문: {}", response.getBody());

        } catch (Exception e) {
            log.error("❌ SMS 발송 실패", e);

            // 상세한 에러 메시지 제공
            if (e.getMessage() != null) {
                if (e.getMessage().contains("400") || e.getMessage().contains("Bad Request")) {
                    log.error("💡 400 에러 발생 원인:");
                    log.error("   1. API Key/Secret이 정확한지 확인");
                    log.error("   2. 발신번호({})가 Solapi 콘솔에 등록되어 있는지 확인", SENDER);
                    log.error("   3. Signature 생성 로직이 올바른지 확인");
                } else if (e.getMessage().contains("403")) {
                    log.error("💡 403 에러 발생 - 인증 실패 또는 권한 없음");
                } else if (e.getMessage().contains("429")) {
                    log.error("💡 429 에러 발생 - API 호출 제한 초과");
                }
            }

            throw new RuntimeException("문자 발송 실패: " + e.getMessage());
        }
    }

    /**
     * HMAC-SHA256 Signature 생성
     * 
     * @param date ISO 8601 형식의 시간
     * @param salt 랜덤 salt 값
     * @return Hex 형식의 signature
     */
    private String createSignature(String date, String salt) throws Exception {
        // date + salt 순서로 데이터 생성 (중요!)
        String data = date + salt;

        Mac mac = Mac.getInstance("HmacSHA256");
        SecretKeySpec keySpec = new SecretKeySpec(
                API_SECRET.getBytes(StandardCharsets.UTF_8),
                "HmacSHA256");

        mac.init(keySpec);
        byte[] rawHmac = mac.doFinal(data.getBytes(StandardCharsets.UTF_8));

        // Base64가 아닌 Hex로 인코딩 (중요!)
        return bytesToHex(rawHmac);
    }

    /**
     * 바이트 배열을 Hex 문자열로 변환
     * 
     * @param bytes 변환할 바이트 배열
     * @return Hex 문자열
     */
    private String bytesToHex(byte[] bytes) {
        StringBuilder hexString = new StringBuilder();
        for (byte b : bytes) {
            String hex = Integer.toHexString(0xff & b);
            if (hex.length() == 1) {
                hexString.append('0');
            }
            hexString.append(hex);
        }
        return hexString.toString();
    }

    /**
     * 랜덤 Salt 생성 (16바이트 = 32자 hex)
     * 
     * @return Hex 형식의 랜덤 salt
     */
    private String generateRandomSalt() {
        SecureRandom random = new SecureRandom();
        byte[] salt = new byte[16];
        random.nextBytes(salt);
        return bytesToHex(salt);
    }

    /**
     * 6자리 인증코드 생성
     * 
     * @return 6자리 숫자 문자열
     */
    public String generateVerificationCode() {
        SecureRandom random = new SecureRandom();
        int code = random.nextInt(900000) + 100000; // 100000 ~ 999999
        return String.valueOf(code);
    }
}