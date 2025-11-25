// src/main/java/com/we/hirehub/service/OnboardingService.java
package com.we.hirehub.service.user;

import com.we.hirehub.dto.user.UsersRequestDto;
import com.we.hirehub.entity.Role;
import com.we.hirehub.entity.Users;
import com.we.hirehub.repository.UsersRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class OnboardingService {

    private final UsersRepository usersRepository;

    /**
     * ✅ 온보딩 저장 로직
     * - 이메일로 사용자 검색
     * - 없으면 새로 생성 (OAuth2 직후 안전성 확보)
     * - 중복 검사 및 필드 업데이트 후 저장
     */
    @Transactional
    public void save(String email, UsersRequestDto profile) {
        Users user = usersRepository.findByEmail(email)
                .orElseGet(() -> {
                    log.warn("⚠️ Onboarding: 기존 사용자 없음, 새로 생성 -> {}", email);
                    Users newUser = new Users();
                    newUser.setEmail(email);
                    newUser.setRole(Role.USER); // ✅ Enum 타입에 맞게 수정
                    return usersRepository.save(newUser);
                });

        // 닉네임 중복 검사
        if (profile.getNickname() != null && !profile.getNickname().isBlank()) {
            boolean nicknameExists = usersRepository.existsByNicknameAndEmailNot(profile.getNickname(), email);
            if (nicknameExists) {
                throw new IllegalArgumentException("이미 사용 중인 닉네임입니다.");
            }
            user.setNickname(profile.getNickname());
        }

        // 전화번호 중복 검사
        if (profile.getPhone() != null && !profile.getPhone().isBlank()) {
            boolean phoneExists = usersRepository.existsByPhoneAndEmailNot(profile.getPhone(), email);
            if (phoneExists) {
                throw new IllegalArgumentException("이미 등록된 전화번호입니다.");
            }
            user.setPhone(profile.getPhone());
        }

        profile.toEntity(user);

        usersRepository.save(user);
        log.info("✅ 온보딩 정보 저장 완료: {}", email);
    }
}
