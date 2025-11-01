// src/main/java/com/we/hirehub/controller/AuthDebugController.java
package com.we.hirehub.controller;

import com.we.hirehub.config.JwtTokenProvider;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/auth/debug")
public class AuthDebugController {

    private final JwtTokenProvider jwt;

    @GetMapping("/decode")
    public ResponseEntity<?> decode(HttpServletRequest req,
                                    @RequestParam(value = "token", required = false) String tokenParam) {
        String header = Optional.ofNullable(req.getHeader("Authorization")).orElse("");
        boolean fromHeader = header.startsWith("Bearer ");
        String token = fromHeader ? header.substring(7) : tokenParam;

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("fromHeader", fromHeader);
        body.put("hasQueryParam", tokenParam != null);

        if (token == null || token.isBlank()) {
            body.put("providedToken", null);
            body.put("valid", false);
            body.put("reason", "missing_token");
            return ResponseEntity.ok(body);
        }

        body.put("providedToken", token.substring(0, Math.min(20, token.length())) + "...");

        try {
            boolean ok = jwt.validate(token);
            body.put("valid", ok);
            if (!ok) {
                body.put("reason", "malformed_jwt");
                return ResponseEntity.ok(body);
            }
            // 프로젝트 시그니처에 맞춤
            String email = jwt.getEmail(token);
            Long uid = jwt.getUserId(token);

            body.put("email", email);
            body.put("userId", uid);
            return ResponseEntity.ok(body);
        } catch (Exception e) {
            body.put("valid", false);
            body.put("reason", e.getClass().getSimpleName() + ": " + e.getMessage());
            return ResponseEntity.ok(body);
        }
    }
}
