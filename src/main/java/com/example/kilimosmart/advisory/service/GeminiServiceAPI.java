package com.example.kilimosmart.advisory.service;

import com.example.kilimosmart.advisory.dto.AdvisoryResponseDto;
import com.example.kilimosmart.config.GeminiProperties;
import com.example.kilimosmart.farmer.entity.Farmer;
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

    public AdvisoryResponseDto analyze(Farmer farmer, String type, String description, String imageBase64) {

        Map<String, Object> request = buildRequest(farmer, type, description, imageBase64);

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

    public String generateInsights(Farmer farmer, String currentMonth) {

        String prompt = buildInsightsPrompt(farmer, currentMonth);
        Map<String, Object> request = Map.of(
                "contents", List.of(Map.of("parts", List.of(Map.of("text", prompt))))
        );

        try {
            String response = restClient.post()
                    .uri("https://generativelanguage.googleapis.com/v1beta/models/"
                            + geminiProperties.model()
                            + ":generateContent?key="
                            + geminiProperties.apiKey())
                    .body(request)
                    .retrieve()
                    .body(String.class);

            log.debug("Gemini INSIGHTS RAW: {}", response);

            var textNode = objectMapper.readTree(response)
                    .path("candidates").get(0)
                    .path("content").path("parts").get(0)
                    .path("text");

            return textNode.asText();
        } catch (Exception e) {
            log.error("Gemini insights failed", e);
            throw new RuntimeException("Gemini insights failed", e);
        }
    }

    private Map<String, Object> buildRequest(Farmer farmer, String type, String description, String imageBase64) {

        String location = farmer != null && farmer.getLocation() != null && !farmer.getLocation().isBlank()
                ? farmer.getLocation()
                : "Kenya (general)";

        String safeDescription = description == null ? "" : description.replace("__LOC__", "").replace("__TYPE__", "").replace("__DESC__", "");

        String prompt = """
                You are a senior agronomist and veterinary officer serving smallholder farmers in Kenya.
                You understand Kenyan counties, agro-ecological zones, planting calendars, and the realities
                of farming with limited resources.

                CONTEXT
                - Farmer location: __LOC__
                - Problem category: __TYPE__
                - Farmer description: __DESC__
                - Reference agro-dealers in Kenya: Amiran Kenya, Syngenta East Africa, Bayer East Africa,
                  Osho Chemical Industries, Cooper Kenya, Farmline Agro, Kenya Highland Seed, East African
                  Seed, Simlaw Seeds, KALRO, and local agro-vet shops in the farmer's town.

                TASK
                Diagnose the problem and recommend practical, affordable, and locally available remedies.

                Return ONLY a single JSON object. No prose, no markdown fences, no commentary.
                All output must be valid JSON parseable by Jackson. Use double quotes everywhere.

                SCHEMA
                {
                  "diagnosis": "Plain-English name of the disease/pest/deficiency/condition and a 1-line cause",
                  "confidence": 0.0,
                  "solution": "3-5 sentence actionable solution written for a smallholder farmer (avoid jargon)",
                  "remedies": [
                    {
                      "name": "Specific product name e.g. 'Duduthrin 1.75EC (Lambda-cyhalothrin)'",
                      "estimatedPrice": "KES 450 per 100ml",
                      "amountNeeded": "20ml per 20L knapsack for 1 acre",
                      "availabilityLocation": "Available at Amiran, agro-vet shops in <specific Kenyan town or 'nearest agrovet'>"
                    }
                  ]
                }

                RULES
                - confidence: decimal between 0 and 1 (e.g. 0.85 means 85 pct sure). Calibrate honestly.
                - Output exactly 2-3 remedies. Each remedy must include a real product and a real Kenyan
                  availability channel. Do not invent brands; use the reference list or other well-known
                  Kenyan brands (Pannar Seed, Royal Seed, Lagrotech, Greenlife, Juanco, Lachlan).
                - Prices in KES and reflect typical Nairobi/regional retail in 2024-2025.
                - If you cannot confidently identify the problem, set confidence below 0.5 and recommend
                  a visit to the nearest agro-vet or extension officer.
                - Adapt remedies to the farmer's location (e.g. highland vs coastal vs arid).
                - Do not include any text outside the JSON object.
                """;

        prompt = prompt
                .replace("__LOC__", location)
                .replace("__TYPE__", type)
                .replace("__DESC__", safeDescription);

        List<Object> parts = new ArrayList<>();
        parts.add(Map.of("text", prompt));

        if (imageBase64 != null && !imageBase64.isBlank()) {
            String cleaned = stripDataUrlPrefix(imageBase64);
            String mime = detectImageMime(cleaned);
            parts.add(Map.of(
                    "inline_data", Map.of(
                            "mime_type", mime,
                            "data", cleaned
                    )
            ));
        }

        return Map.of(
                "contents", List.of(
                        Map.of("parts", parts)
                )
        );
    }

    private String buildInsightsPrompt(Farmer farmer, String currentMonth) {

        String location = farmer != null && farmer.getLocation() != null && !farmer.getLocation().isBlank()
                ? farmer.getLocation()
                : "Kenya";

        String prompt = """
                You are an agricultural extension officer for KiliMoWise, an app for Kenyan smallholder farmers.
                Generate 3 short insight cards for the current month (__MONTH__) tuned to a farmer in or near: __LOC__.

                Return ONLY a single JSON object. No markdown, no commentary, no text outside the JSON.

                SCHEMA
                {
                  "seasonal": [
                    { "title": "Crop or activity", "content": "1-2 sentences, what to plant, prepare, or harvest in __MONTH__ near __LOC__" }
                  ],
                  "market": [
                    { "title": "Short headline", "content": "1-2 sentences on current market price or demand in Kenya, KES values" }
                  ],
                  "tips": [
                    { "content": "1 actionable farming tip relevant this month" }
                  ]
                }

                RULES
                - Each section must contain exactly 3 items.
                - All titles and content must be in English.
                - Prices in KES.
                - Keep each content item under 200 characters.
                - Be specific to __LOC__ and to the current month (__MONTH__).
                """;

        return prompt
                .replace("__MONTH__", currentMonth)
                .replace("__LOC__", location);
    }

    private String stripDataUrlPrefix(String base64) {
        if (base64 == null) return null;
        int comma = base64.indexOf(',');
        if (comma >= 0 && base64.startsWith("data:")) {
            return base64.substring(comma + 1);
        }
        return base64;
    }

    private String detectImageMime(String cleanedBase64) {
        if (cleanedBase64 == null || cleanedBase64.isBlank()) {
            return "image/jpeg";
        }
        String prefix = cleanedBase64.length() >= 8 ? cleanedBase64.substring(0, 8) : cleanedBase64;
        if (prefix.startsWith("/9j/")) return "image/jpeg";
        if (prefix.startsWith("iVBORw")) return "image/png";
        if (prefix.startsWith("R0lGOD")) return "image/gif";
        if (prefix.startsWith("UklGRg")) return "image/webp";
        if (prefix.startsWith("Qk0")) return "image/bmp";
        return "image/jpeg";
    }
}
