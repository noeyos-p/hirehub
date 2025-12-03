package com.we.hirehub.config;

import lombok.Getter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

@Getter
@Configuration
public class KakaoMapConfig {

    @Value("${kakaomap.rest-api-key}")
    private String kakaoRestApiKey;
    }

