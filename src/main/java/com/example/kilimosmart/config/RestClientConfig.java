package com.example.kilimosmart.config;


import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.client.RestClient;

import java.time.Duration;

@Configuration
public class RestClientConfig {

    @Bean
    public RestClient restClient(GeminiProperties geminiProperties) {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout((int) Duration.ofSeconds(geminiProperties.timeoutSeconds()).toMillis());
        factory.setReadTimeout((int) Duration.ofSeconds(geminiProperties.timeoutSeconds()).toMillis());
        return RestClient.builder()
                .requestFactory(factory)
                .build();
    }
}
