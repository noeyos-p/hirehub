package com.we.hirehub.controller.common;

import com.we.hirehub.config.JwtUserPrincipal;
import com.we.hirehub.entity.Users;
import com.we.hirehub.repository.UsersRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/token")
@RequiredArgsConstructor
public class TokenController {

    private final UsersRepository usersRepository;

    /** 내 보유 토큰 조회 */
    @GetMapping("/my")
    public TokenBalanceResponse myTokens() {

        JwtUserPrincipal user =
                (JwtUserPrincipal) SecurityContextHolder.getContext().getAuthentication().getPrincipal();

        Users u = usersRepository.findById(user.getUserId())
                .orElseThrow(() -> new RuntimeException("유저 없음"));

        return new TokenBalanceResponse(u.getTokenBalance());
    }

    public record TokenBalanceResponse(int balance) {}
}
