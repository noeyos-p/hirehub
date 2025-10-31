package com.we.hirehub.auth;

import com.we.hirehub.entity.Role;
import com.we.hirehub.entity.Users;
import com.we.hirehub.repository.UsersRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import jakarta.annotation.PostConstruct;

@Component
@RequiredArgsConstructor
public class AdminSeeder {

    private final UsersRepository usersRepository;
    private final PasswordEncoder passwordEncoder;

    @PostConstruct
    public void seed() {
        usersRepository.findByEmail("admin@admin").ifPresentOrElse(
                u -> {}, // 존재하면 패스
                () -> {
                    Users admin = new Users();
                    admin.setEmail("admin@admin");
                    admin.setPassword(passwordEncoder.encode("admin123"));
                    admin.setRole(Role.ADMIN);
                    usersRepository.save(admin);
                }
        );
    }
}