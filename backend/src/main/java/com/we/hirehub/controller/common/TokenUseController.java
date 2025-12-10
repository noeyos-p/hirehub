package com.we.hirehub.controller.common;

import com.we.hirehub.config.JwtUserPrincipal;
import com.we.hirehub.dto.support.TokenUseRequest;
import com.we.hirehub.service.support.TokenService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/token")
@RequiredArgsConstructor
public class TokenUseController {

    private final TokenService tokenService;

    /** ✔ AI 기능 사용 시 토큰 차감 */
    @PostMapping("/use")
    public void useToken(
            @AuthenticationPrincipal JwtUserPrincipal user,
            @RequestBody TokenUseRequest req
    ) {
        tokenService.useTokens(
                user.getUserId(),
                req.getAmount(),
                req.getFeature(),
                req.getDescription()
        );
    }
}
