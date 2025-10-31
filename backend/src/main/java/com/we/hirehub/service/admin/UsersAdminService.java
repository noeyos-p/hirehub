package com.we.hirehub.service.admin;

import com.we.hirehub.entity.Users;
import com.we.hirehub.repository.UsersRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class UsersAdminService {

    private final UsersRepository usersRepository;

    // 생성
    @Transactional
    public Users createUser(Users user) {
        log.info("사용자 등록: {}", user.getEmail());

        // ✅ 필수 필드 검증
        if (user.getEmail() == null || user.getEmail().trim().isEmpty()) {
            throw new IllegalArgumentException("이메일이 필요합니다");
        }
        if (user.getPassword() == null || user.getPassword().trim().isEmpty()) {
            throw new IllegalArgumentException("비밀번호가 필요합니다");
        }
        if (user.getNickname() == null || user.getNickname().trim().isEmpty()) {
            throw new IllegalArgumentException("닉네임이 필요합니다");
        }
        if (user.getName() == null || user.getName().trim().isEmpty()) {
            throw new IllegalArgumentException("이름이 필요합니다");
        }

        // ✅ 중복 체크
        if (usersRepository.findByEmail(user.getEmail()).isPresent()) {
            throw new IllegalArgumentException("이미 존재하는 이메일입니다");
        }
        if (usersRepository.findByNickname(user.getNickname()).isPresent()) {
            throw new IllegalArgumentException("이미 존재하는 닉네임입니다");
        }

        return usersRepository.save(user);
    }

    // ============ 조회 ============

    public Page<Users> getAllUsers(Pageable pageable) {
        log.debug("모든 사용자 조회");
        return usersRepository.findAll(pageable);
    }

    public Users getUserById(Long userId) {
        log.debug("사용자 조회: {}", userId);
        return usersRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다: " + userId));
    }
    // ============ 수정 ============

    @Transactional
    public Users updateUser(Long userId, Users updateData) {
        log.info("사용자 정보 수정: {}", userId);
        Users user = getUserById(userId);

        if (updateData.getName() != null && !updateData.getName().trim().isEmpty()) {
            user.setName(updateData.getName());
        }
        if (updateData.getEmail() != null && !updateData.getEmail().trim().isEmpty()) {
            user.setEmail(updateData.getEmail());
        }
        if (updateData.getNickname() != null && !updateData.getNickname().trim().isEmpty()) {
            user.setNickname(updateData.getNickname());
        }

        // ✅ role 업데이트 추가
        if (updateData.getRole() != null) {
            user.setRole(updateData.getRole());
            log.info("역할 변경: {}", updateData.getRole());
        }

        // ✅ password 업데이트 추가 (비밀번호가 있을 때만)
        if (updateData.getPassword() != null && !updateData.getPassword().trim().isEmpty()) {
            user.setPassword(updateData.getPassword());
            log.info("비밀번호 변경됨");
        }

        if (updateData.getPhone() != null) user.setPhone(updateData.getPhone());
        if (updateData.getEducation() != null) user.setEducation(updateData.getEducation());
        if (updateData.getCareerLevel() != null) user.setCareerLevel(updateData.getCareerLevel());
        if (updateData.getPosition() != null) user.setPosition(updateData.getPosition());
        if (updateData.getAddress() != null) user.setAddress(updateData.getAddress());
        if (updateData.getLocation() != null) user.setLocation(updateData.getLocation());

        Users savedUser = usersRepository.save(user);
        log.info("사용자 정보 수정 완료 - userId: {}, email: {}", userId, savedUser.getEmail());

        return savedUser;
    }

    // ============ 삭제 ============

    @Transactional
    public void deleteUser(Long userId) {
        log.info("사용자 삭제: {}", userId);
        if (!usersRepository.existsById(userId)) {
            throw new IllegalArgumentException("존재하지 않는 사용자입니다");
        }
        usersRepository.deleteById(userId);
    }
}