package com.example.ainews.config;

import java.time.Clock;
import java.time.ZoneId;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class ClockConfig {
    public static final ZoneId SEOUL_ZONE = ZoneId.of("Asia/Seoul");

    @Bean
    Clock clock() {
        return Clock.system(SEOUL_ZONE);
    }
}
