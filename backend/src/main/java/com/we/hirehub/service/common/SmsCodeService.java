package com.we.hirehub.service.common;

import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

@Service
public class SmsCodeService {

    private final Map<String, String> codes = new HashMap<>();
    private final Map<String, Boolean> verified = new HashMap<>();

    public void saveCode(String phone, String code) {
        codes.put(phone, code);
    }

    public boolean verify(String phone, String code) {
        String saved = codes.get(phone);
        if (saved != null && saved.equals(code)) {
            verified.put(phone, true);
            return true;
        }
        return false;
    }

    public boolean isVerified(String phone) {
        return verified.getOrDefault(phone, false);
    }
}
