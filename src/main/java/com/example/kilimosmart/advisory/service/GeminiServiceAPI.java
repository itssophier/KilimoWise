package com.example.kilimosmart.advisory.service;

import com.example.kilimosmart.advisory.dto.AdvisoryResponseDto;
import com.example.kilimosmart.config.GeminiProperties;
import com.example.kilimosmart.config.errors.ApiException;
import com.example.kilimosmart.farmer.entity.Farmer;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.HttpServerErrorException;
import org.springframework.web.client.ResourceAccessException;
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

        if (geminiProperties.apiKey() == null || geminiProperties.apiKey().isBlank()) {
            log.warn("GEMINI_API_KEY not set; returning offline fallback diagnosis");
            return offlineFallback(type, "AI advisor is temporarily unavailable. Please try again shortly, or visit your nearest agro-vet for in-person advice.");
        }

        int maxAttempts = 3;
        long backoffMs = 800;

        for (int attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                String response = restClient.post()
                        .uri("https://generativelanguage.googleapis.com/v1beta/models/"
                                + geminiProperties.model()
                                + ":generateContent?key="
                                + geminiProperties.apiKey())
                        .body(request)
                        .retrieve()
                        .body(String.class);

                log.debug("Gemini RAW RESPONSE (attempt {}): {}", attempt, response);

                var root = objectMapper.readTree(response);
                var candidates = root.path("candidates");

                if (!candidates.isArray() || candidates.isEmpty()) {
                    String blockReason = root.path("promptFeedback").path("blockReason").asText("");
                    if (!blockReason.isBlank()) {
                        log.warn("Gemini blocked the request: {}", blockReason);
                        return offlineFallback(type, "Your question was blocked by the safety filter (" + blockReason + "). Try rephrasing the description.");
                    }
                    throw new RuntimeException("Gemini returned empty response");
                }

                var textNode = candidates.get(0).path("content").path("parts");
                if (!textNode.isArray() || textNode.isEmpty()) {
                    String finishReason = candidates.get(0).path("finishReason").asText("");
                    if (!finishReason.isBlank()) {
                        return offlineFallback(type, "The AI couldn't complete this request (reason: " + finishReason + "). Try a different description.");
                    }
                    throw new RuntimeException("Gemini returned invalid parts");
                }

                String text = textNode.get(0).path("text").asText();
                log.info("Gemini TEXT OUTPUT: {}", text);

                String cleanedJson = stripCodeFences(text);
                AdvisoryResponseDto parsed = objectMapper.readValue(cleanedJson, AdvisoryResponseDto.class);
                return sanitize(parsed);

            } catch (HttpClientErrorException.TooManyRequests e) {
                log.warn("Gemini 429 (attempt {}/{}): quota exceeded", attempt, maxAttempts);
                if (attempt == maxAttempts) {
                    return offlineFallback(type, "AI advisor is rate-limited right now. Please wait a few minutes and try again, or visit your nearest agro-vet.");
                }
                sleep(backoffMs * attempt);
            } catch (HttpClientErrorException.Forbidden e) {
                log.error("Gemini 403 - check API key / billing", e);
                return offlineFallback(type, "AI advisor is unavailable due to a configuration issue. Please contact support.");
            } catch (HttpClientErrorException e) {
                log.error("Gemini client error {}: {}", e.getStatusCode(), e.getMessage());
                if (e.getStatusCode().value() >= 500 && attempt < maxAttempts) {
                    sleep(backoffMs * attempt);
                    continue;
                }
                return offlineFallback(type, "AI advisor is temporarily unavailable (error " + e.getStatusCode().value() + "). Please try again in a moment.");
            } catch (HttpServerErrorException e) {
                log.error("Gemini server error {}: {}", e.getStatusCode(), e.getMessage());
                if (attempt < maxAttempts) { sleep(backoffMs * attempt); continue; }
                return offlineFallback(type, "AI advisor is temporarily unavailable. Please try again shortly.");
            } catch (ResourceAccessException e) {
                log.error("Gemini timeout / network", e);
                if (attempt < maxAttempts) { sleep(backoffMs * attempt); continue; }
                return offlineFallback(type, "AI advisor timed out. Please try again with a shorter description.");
            } catch (Exception e) {
                log.error("Gemini failed (attempt {})", attempt, e);
                if (attempt < maxAttempts) { sleep(backoffMs * attempt); continue; }
                throw new ApiException("ADVISORY_FAILED", "AI advisor could not generate a diagnosis. Please try again.", true);
            }
        }

        return offlineFallback(type, "AI advisor is temporarily unavailable. Please try again shortly.");
    }

    private void sleep(long ms) {
        try { Thread.sleep(ms); } catch (InterruptedException ie) { Thread.currentThread().interrupt(); }
    }

    private AdvisoryResponseDto offlineFallback(String type, String userMessage) {
        boolean isCrop = "CROP".equalsIgnoreCase(type);
        return sanitize(new AdvisoryResponseDto(
                "AI advisor is temporarily unavailable",
                "0.3",
                userMessage,
                List.of(
                        new com.example.kilimosmart.advisory.dto.RemedyResponseDto(
                                isCrop ? "Manual crop inspection" : "Visit veterinary officer",
                                "KES 200 - 500 (consultation fee)",
                                "1 visit",
                                isCrop ? "KALRO office or agro-vet in your sub-county" : "Nearest agro-vet or veterinary office"
                        ),
                        new com.example.kilimosmart.advisory.dto.RemedyResponseDto(
                                isCrop ? "Photograph the affected area in daylight" : "Photograph the affected animal or area",
                                "KES 0 (free)",
                                "1 clear photo + 2-line description",
                                "Use your phone camera"
                        ),
                        new com.example.kilimosmart.advisory.dto.RemedyResponseDto(
                                "Try again in 5-10 minutes",
                                "KES 0 (free)",
                                "1 retry",
                                "Tap the Ask button again"
                        )
                )
        ));
    }

    public String generateInsights(Farmer farmer, String currentMonth) {

        if (geminiProperties.apiKey() == null || geminiProperties.apiKey().isBlank()) {
            log.warn("GEMINI_API_KEY not set; insights will use static fallback");
            return null;
        }

        String prompt = buildInsightsPrompt(farmer, currentMonth);
        Map<String, Object> request = Map.of(
                "contents", List.of(Map.of("parts", List.of(Map.of("text", prompt))))
        );

        int maxAttempts = 2;
        for (int attempt = 1; attempt <= maxAttempts; attempt++) {
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
            } catch (HttpClientErrorException.TooManyRequests e) {
                log.warn("Gemini insights 429 (attempt {}/{})", attempt, maxAttempts);
                if (attempt == maxAttempts) return null;
                sleep(600L * attempt);
            } catch (Exception e) {
                log.error("Gemini insights failed", e);
                return null;
            }
        }
        return null;
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
                      "estimatedPrice": "KES 450 / 100ml (estimated Nairobi/regional retail 2024-25)",
                      "amountNeeded": "20ml per 20L knapsack — enough for 1 acre",
                      "availabilityLocation": "Agro-vet shops in <specific Kenyan town> and Amiran Kenya depots; ask for 'Duduthrin 1.75EC'"
                    }
                  ]
                }

                RULES
                - confidence: decimal between 0 and 1 (e.g. 0.85 means 85 pct sure). Calibrate honestly.
                - Output exactly 3 remedies. Each remedy must include a real product and a real Kenyan
                  availability channel. Do not invent brands; use the reference list or other well-known
                  Kenyan brands (Pannar Seed, Royal Seed, Lagrotech, Greenlife, Juanco, Lachlan, Osho, Amiran).
                - Prices in KES and reflect typical Nairobi/regional retail in 2024-2025. ALWAYS include
                  a KES amount. Format: "KES <number> per <unit>" or "KES <number> / <unit>". Never
                  leave the price blank, and never say "varies" — give a real number, even if approximate.
                - If you cannot confidently identify the problem, set confidence below 0.5 and recommend
                  a visit to the nearest agro-vet or extension officer.
                - Adapt remedies to the farmer's location (e.g. highland vs coastal vs arid).
                - amountNeeded must be a specific quantity (e.g. "20ml", "2kg", "1 sachet per 20L").
                - availabilityLocation must name a town, city, or specific agro-dealer (e.g. "Nakuru
                  agro-vet shops" or "Amiran depot, Nairobi").
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

    private AdvisoryResponseDto sanitize(AdvisoryResponseDto dto) {
        if (dto == null) {
            return new AdvisoryResponseDto(
                    "Unable to diagnose. Please try again or visit your nearest agro-vet.",
                    "0.3",
                    "We could not generate a solution. Try describing the problem with more detail, or contact your local extension officer.",
                    java.util.List.of(
                            new com.example.kilimosmart.advisory.dto.RemedyResponseDto(
                                    "Visit nearest agro-vet",
                                    "KES 200 - 500 consultation",
                                    "1 visit",
                                    "Any agro-vet shop in your town"
                            )
                    )
            );
        }
        String diagnosis = (dto.diagnosis() == null || dto.diagnosis().isBlank())
                ? "Unclear diagnosis — please re-describe with more detail"
                : dto.diagnosis();
        String confidence = (dto.confidence() == null || dto.confidence().isBlank()) ? "0.3" : dto.confidence();
        String solution = (dto.solution() == null || dto.solution().isBlank())
                ? "No detailed solution available. Visit your nearest agro-vet for in-person diagnosis."
                : dto.solution();

        List<com.example.kilimosmart.advisory.dto.RemedyResponseDto> remedies = dto.remedies() == null
                ? new java.util.ArrayList<>()
                : new java.util.ArrayList<>(dto.remedies());

        if (remedies.isEmpty()) {
            remedies.add(new com.example.kilimosmart.advisory.dto.RemedyResponseDto(
                    "Visit nearest agro-vet for diagnosis",
                    "KES 200 - 500 consultation fee",
                    "1 consultation",
                    "Any agro-vet shop in your town or KALRO office"
            ));
        }

        java.util.List<com.example.kilimosmart.advisory.dto.RemedyResponseDto> cleaned = new java.util.ArrayList<>();
        for (var r : remedies) {
            String name = (r.name() == null || r.name().isBlank()) ? "Generic agro-vet recommendation" : r.name();
            String price = (r.estimatedPrice() == null || r.estimatedPrice().isBlank()
                    || r.estimatedPrice().equalsIgnoreCase("varies")
                    || !r.estimatedPrice().toUpperCase().contains("KES"))
                    ? "KES 200 - 1,500 (price varies by brand and quantity)"
                    : r.estimatedPrice();
            String amount = (r.amountNeeded() == null || r.amountNeeded().isBlank())
                    ? "As per product label"
                    : r.amountNeeded();
            String avail = (r.availabilityLocation() == null || r.availabilityLocation().isBlank())
                    ? "Agro-vet shops in your nearest town; ask for " + name.split("\\(")[0].trim()
                    : r.availabilityLocation();
            cleaned.add(new com.example.kilimosmart.advisory.dto.RemedyResponseDto(name, price, amount, avail));
        }

        return new AdvisoryResponseDto(diagnosis, confidence, solution, cleaned);
    }

    private String stripDataUrlPrefix(String base64) {
        if (base64 == null) return null;
        int comma = base64.indexOf(',');
        if (comma >= 0 && base64.startsWith("data:")) {
            return base64.substring(comma + 1);
        }
        return base64;
    }

    private String stripCodeFences(String raw) {
        if (raw == null) return "";
        String s = raw.trim();
        if (s.startsWith("```")) {
            int firstNewline = s.indexOf('\n');
            if (firstNewline >= 0) s = s.substring(firstNewline + 1);
            int lastFence = s.lastIndexOf("```");
            if (lastFence >= 0) s = s.substring(0, lastFence);
        }
        return s.trim();
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
