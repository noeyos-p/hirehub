package com.we.hirehub;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.core.env.Environment;

import java.util.Arrays;

@SpringBootApplication
public class HirehubApplication {

	@Autowired
	public HirehubApplication(Environment env) {
		System.out.println("🟢 Active Profiles: " + Arrays.toString(env.getActiveProfiles()));
		System.out.println("🟢 Kakao client-id: " + env.getProperty("spring.security.oauth2.client.registration.kakao.client-id"));
	}
	public static void main(String[] args) {
		SpringApplication.run(HirehubApplication.class, args);
	}

}

