
package com.example.kilimosmart.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "gemini")
public record GeminiProperties(
        String apiKey,
        String model,
        long timeoutSeconds
) {
    public GeminiProperties {
        if (timeoutSeconds <= 0) {
            timeoutSeconds = 30L;
        }
    }
}
