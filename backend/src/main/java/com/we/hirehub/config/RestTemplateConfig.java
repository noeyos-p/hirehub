package com.we.hirehub.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.http.converter.StringHttpMessageConverter;
import org.springframework.web.client.RestTemplate;

import java.nio.charset.StandardCharsets;

@Slf4j
@Configuration
public class RestTemplateConfig {

    @Bean
    public RestTemplate restTemplate() {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();

        // 밀리초 단위로 직접 설정 (deprecated 아님)
        factory.setConnectTimeout(10000);  // 10초
        factory.setReadTimeout(30000);     // 30초

        RestTemplate rt = new RestTemplate(factory);

        // 🔥 UTF-8 인코딩 강제 설정 (가장 중요!)
        rt.getMessageConverters().add(0, new StringHttpMessageConverter(StandardCharsets.UTF_8));

        return rt;
    }
}
