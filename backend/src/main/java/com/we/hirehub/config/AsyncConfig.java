package com.we.hirehub.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.AsyncConfigurer;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

import java.util.concurrent.Executor;

@Configuration
@EnableAsync
public class AsyncConfig implements AsyncConfigurer {

    @Override
    public Executor getAsyncExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(5);           // 기본 스레드 5개
        executor.setMaxPoolSize(10);           // 최대 스레드 10개
        executor.setQueueCapacity(100);        // 대기 큐 100개
        executor.setThreadNamePrefix("Async-Moderator-");
        executor.initialize();
        return executor;
    }
}
