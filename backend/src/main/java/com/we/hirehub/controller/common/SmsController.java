package com.we.hirehub.controller.common;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import com.we.hirehub.service.common.SmsCodeService;
import com.we.hirehub.service.common.SmsService;
import java.util.Map;

@RestController
@RequestMapping("/api/sms")
@RequiredArgsConstructor
public class SmsController {

    private final SmsService smsService;
    private final SmsCodeService smsCodeService;

    @PostMapping("/send")
    public ResponseEntity<?> send(@RequestBody Map<String, String> req) {
        try {
            String phone = req.get("phone");
            String code = String.valueOf((int) (Math.random() * 900000) + 100000);

            smsCodeService.saveCode(phone, code);
            smsService.sendCode(phone, code);

            return ResponseEntity.ok(Map.of("message", "인증번호가 전송되었습니다."));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("message", "문자 전송 실패: " + e.getMessage()));
        }
    }

    @PostMapping("/verify")
    public ResponseEntity<?> verify(@RequestBody Map<String, String> req) {
        String phone = req.get("phone");
        String code = req.get("code");

        if (smsCodeService.verify(phone, code)) {
            return ResponseEntity.ok(Map.of("message", "인증 성공"));
        }
        return ResponseEntity.status(400).body(Map.of("message", "인증번호가 일치하지 않습니다."));
    }
}
