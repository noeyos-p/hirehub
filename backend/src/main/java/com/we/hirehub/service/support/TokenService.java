package com.we.hirehub.service.support;

import com.we.hirehub.entity.TokenHistory;
import com.we.hirehub.entity.Users;
import com.we.hirehub.repository.TokenHistoryRepository;
import com.we.hirehub.repository.UsersRepository;
import com.we.hirehub.exception.InsufficientTokenException;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Transactional  // ★ 추가!!

public class TokenService {

    private final UsersRepository usersRepository;
    private final TokenHistoryRepository tokenHistoryRepository;

    /** ✔ 토큰 지급 + 히스토리 기록 */
    public void addTokens(Long userId, int amount, String feature, String desc) {
        Users user = usersRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("유저 없음"));

        user.setTokenBalance(user.getTokenBalance() + amount);

        tokenHistoryRepository.save(TokenHistory.builder()
                .user(user)
                .amount(amount)
                .feature(feature)
                .description(desc)
                .build());
    }

    /** ✔ 토큰 차감 + 히스토리 기록 */
    public void useTokens(Long userId, int amount, String feature, String desc) {
        Users user = usersRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("유저 없음"));

        if (user.getTokenBalance() < amount) {
            throw new InsufficientTokenException("토큰이 부족합니다.");
        }

        user.setTokenBalance(user.getTokenBalance() - amount);

        tokenHistoryRepository.save(TokenHistory.builder()
                .user(user)
                .amount(-amount)
                .feature(feature)
                .description(desc)
                .build());
    }
}
