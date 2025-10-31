package com.we.hirehub.service;

import com.we.hirehub.dto.SignupEmailRequest;
import com.we.hirehub.dto.SignupRequest;
import com.we.hirehub.entity.Role;
import com.we.hirehub.entity.Users;
import com.we.hirehub.repository.UsersRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UsersRepository usersRepository;
    private final PasswordEncoder passwordEncoder;

    /**
     * 일반 회원가입: 최소 정보로 가입 (이메일/비밀번호만)
     */
    @Transactional
    public void signupMinimal(SignupEmailRequest req) {
        if (usersRepository.existsByEmail(req.getEmail())) {
            throw new IllegalStateException("EMAIL_ALREADY_EXISTS");
        }

        Users user = new Users();
        user.setEmail(req.getEmail());
        user.setPassword(passwordEncoder.encode(req.getPassword()));
        user.setRole(Role.USER);

        usersRepository.save(user);
    }

    /**
     * OAuth2 회원가입/로그인: 구글 등 소셜 로그인
     */
    @Transactional
    public Users createOrUpdateOAuth2User(String email) {
        return usersRepository.findByEmail(email)
                .orElseGet(() -> {
                    Users newUser = new Users();
                    newUser.setEmail(email);
                    newUser.setPassword(passwordEncoder.encode("OAUTH2_NO_PASSWORD_" + System.currentTimeMillis()));
                    newUser.setRole(Role.USER);
                    return usersRepository.save(newUser);
                });
    }

    /**
     * 호환용: 예전 컨트롤러가 부르는 메서드
     */
    @Transactional
    public void signup(SignupRequest full) {
        SignupEmailRequest req = new SignupEmailRequest(full.getEmail(), full.getPassword());
        signupMinimal(req);
    }
}