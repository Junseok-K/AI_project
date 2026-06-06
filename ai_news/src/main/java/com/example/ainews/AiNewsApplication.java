package com.example.ainews;

import com.example.ainews.config.KakaoProperties;
import com.example.ainews.config.NaverProperties;
import com.example.ainews.config.NewsProperties;
import com.example.ainews.config.OpenAiProperties;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.scheduling.annotation.EnableScheduling;

@EnableScheduling
@SpringBootApplication
@EnableConfigurationProperties({
        NewsProperties.class,
        NaverProperties.class,
        OpenAiProperties.class,
        KakaoProperties.class
})
public class AiNewsApplication {

    public static void main(String[] args) {
        SpringApplication.run(AiNewsApplication.class, args);
    }
}
