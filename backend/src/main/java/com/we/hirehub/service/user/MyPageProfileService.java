package com.we.hirehub.service.user;

import com.we.hirehub.dto.user.UsersDto;
import com.we.hirehub.dto.user.UsersRequestDto;
import com.we.hirehub.entity.Users;
import com.we.hirehub.exception.ResourceNotFoundException;
import com.we.hirehub.repository.UsersRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class MyPageProfileService {

    private final UsersRepository usersRepository;

    /* ==========================================================
     *                     [Profile 조회]
     * ========================================================== */

    public UsersDto.Profile getProfile(Long userId) {
        Users user = usersRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("회원 정보를 찾을 수 없습니다."));

        return UsersDto.toProfile(user);
    }
    /* ==========================================================
     *                     [Profile 수정]
     * ========================================================== */
    @Transactional
    public UsersDto.Profile updateProfile(Long userId, UsersRequestDto dto) {
        Users user = usersRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("회원 정보를 찾을 수 없습니다."));
        // 닉네임 중복 체크
        if (dto.getNickname() != null && !dto.getNickname().equals(user.getNickname())) {
            boolean exists = usersRepository.existsByNickname(dto.getNickname());
            if (exists) {
                throw new IllegalArgumentException("이미 사용 중인 닉네임입니다.");
            }
        }
        dto.toEntity(user);
        usersRepository.save(user);
        return UsersDto.toProfile(user);
    }

    /**
     * ✅ 소프트 삭제(논리 탈퇴): 실제 삭제 대신 식별자 변경
     */
    @Transactional
    public boolean softWithdrawUser(String email) {
        Optional<Users> optUser = usersRepository.findByEmail(email);

        if (optUser.isEmpty()) {
            log.warn("⚠️ 탈퇴 시도 실패 - 이메일 없음: {}", email);
            return false;
        }

        Users user = optUser.get();

        // 이미 탈퇴 처리된 사용자 방지
        if ("(탈퇴한 회원)".equals(user.getNickname()) || user.getEmail().contains("_deleted_")) {
            log.info("⚠️ 이미 탈퇴된 회원: {}", email);
            return false;
        }

        // ✅ 탈퇴 마킹 처리
        String newEmail = user.getEmail() + "_deleted_" + System.currentTimeMillis();
        user.setEmail(newEmail);
        user.setNickname("(탈퇴한 회원)");

        // 개인 식별 정보 초기화 (선택적)
        user.setPhone(null);
        user.setAddress(null);
        user.setGender(null);
        user.setPosition(null);
        user.setCareerLevel(null);
        user.setEducation(null);
        user.setLocation(null);

        usersRepository.save(user);
        log.info("✅ 회원 소프트삭제 완료: {} → {}", email, newEmail);
        return true;
    }

}