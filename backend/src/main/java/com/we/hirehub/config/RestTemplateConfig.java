package com.we.hirehub.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.client.RestTemplate;

@Slf4j
@Configuration
public class RestTemplateConfig {

    @Bean
    public RestTemplate restTemplate() {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();

        // 밀리초 단위로 직접 설정 (deprecated 아님)
        factory.setConnectTimeout(10000);  // 10초
        factory.setReadTimeout(30000);     // 30초

        return new RestTemplate(factory);
    }
}
