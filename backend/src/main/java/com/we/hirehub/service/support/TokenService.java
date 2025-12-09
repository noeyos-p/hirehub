package com.we.hirehub.service.support;

import com.we.hirehub.entity.Users;
import com.we.hirehub.repository.UsersRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class TokenService {

    private final UsersRepository usersRepository;

    /** ✔ 토큰 지급 (결제 성공 시) */
    public void addTokens(Long userId, int amount) {
        Users user = usersRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("유저 없음"));

        user.setTokenBalance(user.getTokenBalance() + amount);
    }

    /** ✔ 토큰 차감 (AI기능 사용 시) */
    public void useTokens(Long userId, int amount) {
        Users user = usersRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("유저 없음"));

        if (user.getTokenBalance() < amount) {
            throw new RuntimeException("토큰이 부족합니다.");
        }

        user.setTokenBalance(user.getTokenBalance() - amount);
    }
}
