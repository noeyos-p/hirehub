package com.we.hirehub.controller.common;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.we.hirehub.config.JwtUserPrincipal;
import com.we.hirehub.entity.TokenHistory;
import com.we.hirehub.repository.TokenHistoryRepository;
import com.we.hirehub.repository.UsersRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/token")
@RequiredArgsConstructor
public class TokenHistoryController {

    private final TokenHistoryRepository tokenHistoryRepository;

    /**
     * 내 토큰 사용 내역 조회
     */
    @GetMapping("/usage")
    public List<TokenUseResponse> getUsage() {

        JwtUserPrincipal principal =
                (JwtUserPrincipal) SecurityContextHolder.getContext().getAuthentication().getPrincipal();

        Long userId = principal.getUserId();

        return tokenHistoryRepository.findAllByUserIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(TokenUseResponse::from)
                .toList();
    }

    record TokenUseResponse(
            Long id,

            @JsonProperty("amount")
            int amount,

            @JsonProperty("feature")
            String feature,

            @JsonProperty("description")
            String description,

            @JsonProperty("createdAt")
            String createdAt
    ) {
        static TokenUseResponse from(TokenHistory h) {
            return new TokenUseResponse(
                    h.getId(),
                    h.getAmount(),
                    h.getFeature(),         // 강제 매핑됨
                    h.getDescription(),
                    h.getCreatedAt().toString()
            );
        }
    }
}

