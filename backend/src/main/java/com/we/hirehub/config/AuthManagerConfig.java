package com.we.hirehub.config;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.ProviderManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;

/**
 * Username/Password 로그인용 AuthenticationManager를 명시적으로 등록.
 * AuthRestController 생성자 주입을 이 빈이 해결한다.
 */
@Configuration
public class AuthManagerConfig {

    @Bean
    public AuthenticationManager authenticationManager(
            // DbUserDetailsService의 빈 이름은 기본적으로 "dbUserDetailsService"야.
            @Qualifier("dbUserDetailsService") UserDetailsService userDetailsService,
            PasswordEncoder passwordEncoder
    ) {
        DaoAuthenticationProvider provider = new DaoAuthenticationProvider();
        provider.setUserDetailsService(userDetailsService);
        provider.setPasswordEncoder(passwordEncoder);
        return new ProviderManager(provider);
    }
}
