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
                u -> {
                }, // 존재하면 패스
                () -> {
                    Users admin = new Users();
                    admin.setEmail("admin@admin");
                    admin.setPassword(passwordEncoder.encode("admin123"));
                    admin.setRole(Role.ADMIN);
                    admin.setPhoneVerified(true); // 🔥 필수
                    usersRepository.save(admin);
                }
        );


        // 2️⃣ BOT 자동 생성
        usersRepository.findByEmail("bot@bot").ifPresentOrElse(
                u -> {
                },
                () -> {
                    Users bot = new Users();
                    bot.setEmail("bot@bot");
                    bot.setPassword(passwordEncoder.encode("bot123"));
                    bot.setRole(Role.BOT);
                    bot.setPhoneVerified(true); // 🔥 필수
                    usersRepository.save(bot);
                }
        );
    }
}

