package com.we.hirehub.service;

import com.we.hirehub.dto.OnboardingForm;
import com.we.hirehub.entity.Users;
import com.we.hirehub.repository.UsersRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class OnboardingService {

    private final UsersRepository usersRepository;

    @Transactional
    public void save(String email, OnboardingForm form) {
        Users user = usersRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalStateException("User not found: " + email));

        // 닉네임 중복 검사
        if (form.getNickname() != null && !form.getNickname().isBlank()) {
            boolean nicknameExists = usersRepository.existsByNicknameAndEmailNot(form.getNickname(), email);
            if (nicknameExists) {
                throw new IllegalArgumentException("이미 사용 중인 닉네임입니다.");
            }
            user.setNickname(form.getNickname());
        }

        // 전화번호 중복 검사
        if (form.getPhone() != null && !form.getPhone().isBlank()) {
            boolean phoneExists = usersRepository.existsByPhoneAndEmailNot(form.getPhone(), email);
            if (phoneExists) {
                throw new IllegalArgumentException("이미 등록된 전화번호입니다.");
            }
            user.setPhone(form.getPhone());
        }

        // 기본 정보
        if (form.getDisplayName() != null && !form.getDisplayName().isBlank()) {
            user.setName(form.getDisplayName());
        }
        if (form.getDob() != null && !form.getDob().isBlank()) {
            user.setDob(form.getDob());
        }
        if (form.getGender() != null && !form.getGender().isBlank()) {
            user.setGender(form.getGender());
        }

        // 추가 정보
        if (form.getEducation() != null && !form.getEducation().isBlank()) {
            user.setEducation(form.getEducation());
        }
        if (form.getCareerLevel() != null && !form.getCareerLevel().isBlank()) {
            user.setCareerLevel(form.getCareerLevel());
        }
        if (form.getPosition() != null && !form.getPosition().isBlank()) {
            user.setPosition(form.getPosition());
        }
        if (form.getAddress() != null && !form.getAddress().isBlank()) {
            user.setAddress(form.getAddress());
        }
        if (form.getLocation() != null && !form.getLocation().isBlank()) {
            user.setLocation(form.getLocation());
        }

        usersRepository.save(user);
    }
}