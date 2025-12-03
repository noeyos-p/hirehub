package com.we.hirehub.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Getter
@Setter
@Configuration
@ConfigurationProperties(prefix = "inicis")
public class InicisConfigProperties {
    private String mid;
    private String signKey;
    private String apiUrl;
}
