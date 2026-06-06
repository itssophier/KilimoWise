package com.example.kilimosmart.advisory.service;

import com.example.kilimosmart.advisory.dto.AdvisoryResponseDto;
import com.example.kilimosmart.config.GeminiProperties;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import tools.jackson.databind.ObjectMapper;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class GeminiServiceAPI {

    private final GeminiProperties geminiProperties;
    private final ObjectMapper objectMapper;
    private final RestClient restClient;

    public AdvisoryResponseDto analyze(String type, String description, String imageBase64) {

        Map<String, Object> request = buildRequest(type, description, imageBase64);

        try {

            String response = restClient.post()
                    .uri("https://generativelanguage.googleapis.com/v1beta/models/"
                            + geminiProperties.model()
                            + ":generateContent?key="
                            + geminiProperties.apiKey())
                    .body(request)
                    .retrieve()
                    .body(String.class);

            log.debug("Gemini RAW RESPONSE: {}", response);

            var root = objectMapper.readTree(response);

            var candidates = root.path("candidates");

            if (!candidates.isArray() || candidates.isEmpty()) {
                throw new RuntimeException("Gemini returned empty response");
            }

            var textNode = candidates.get(0)
                    .path("content")
                    .path("parts");

            if (!textNode.isArray() || textNode.isEmpty()) {
                throw new RuntimeException("Gemini returned invalid parts");
            }

            String text = textNode.get(0).path("text").asText();

            log.info("Gemini TEXT OUTPUT: {}", text);

            return objectMapper.readValue(text, AdvisoryResponseDto.class);

        } catch (Exception e) {
            log.error("Gemini failed", e);
            throw new RuntimeException("Gemini failed", e);
        }
    }

    private Map<String, Object> buildRequest(String type, String description, String imageBase64) {

        String prompt = """
                You are a Kenyan agricultural expert.
                
                Return ONLY valid JSON.
                
                Rules:
                - Prices MUST be in KES
                - No markdown
                - No explanations
                
                Output format:
                {
                  "diagnosis": "",
                  "confidence": "",
                  "solution": "",
                  "remedies": [
                    {
                      "name": "",
                      "estimatedPrice": "",
                      "amountNeeded": "",
                      "availabilityLocation": "Kenya"
                    }
                  ]
                }
                
                Type: %s
                Description: %s
                """.formatted(type, description);

        List<Object> parts = new ArrayList<>();
        parts.add(Map.of("text", prompt));

        // ✅ FIX: include image if present
        if (imageBase64 != null && !imageBase64.isBlank()) {
            parts.add(Map.of(
                    "inline_data", Map.of(
                            "mime_type", "image/jpeg",
                            "data", imageBase64
                    )
            ));
        }

        return Map.of(
                "contents", List.of(
                        Map.of("parts", parts)
                )
        );
    }
}