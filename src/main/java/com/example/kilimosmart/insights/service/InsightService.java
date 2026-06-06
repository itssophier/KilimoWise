package com.example.kilimosmart.insights.service;

import com.example.kilimosmart.advisory.service.GeminiServiceAPI;
import com.example.kilimosmart.farmer.entity.Farmer;
import com.example.kilimosmart.farmer.repository.FarmerRepository;
import com.example.kilimosmart.insights.dto.InsightResponseDto;
import com.example.kilimosmart.insights.dto.InsightResponseDto.InsightItem;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Locale;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;

@Service
@RequiredArgsConstructor
@Slf4j
public class InsightService {

    private static final long CACHE_TTL_HOURS = 6L;
    private static final DateTimeFormatter MONTH_FMT = DateTimeFormatter.ofPattern("MMMM", Locale.ENGLISH);

    private final FarmerRepository farmerRepository;
    private final GeminiServiceAPI geminiServiceAPI;
    private final ObjectMapper objectMapper;

    private final ConcurrentMap<String, CachedInsight> cache = new ConcurrentHashMap<>();

    public InsightResponseDto getInsights(Long farmerId) {

        Farmer farmer = farmerRepository.findById(farmerId)
                .orElseThrow(() -> new RuntimeException("Farmer not found"));

        String month = LocalDate.now().format(MONTH_FMT);
        String location = farmer.getLocation() != null ? farmer.getLocation() : "Kenya";
        String cacheKey = farmerId + ":" + month + ":" + location.toLowerCase(Locale.ROOT);

        CachedInsight cached = cache.get(cacheKey);
        if (cached != null && !cached.isExpired()) {
            return cached.payload();
        }

        String rawJson = geminiServiceAPI.generateInsights(farmer, month);
        InsightResponseDto parsed = parse(rawJson, month, location);

        cache.put(cacheKey, new CachedInsight(parsed, System.currentTimeMillis() + CACHE_TTL_HOURS * 3_600_000L));

        return parsed;
    }

    private InsightResponseDto parse(String rawJson, String month, String location) {

        try {
            String trimmed = stripCodeFences(rawJson);
            JsonNode root = objectMapper.readTree(trimmed);

            return new InsightResponseDto(
                    LocalDate.now().toString(),
                    month,
                    location,
                    readItems(root.path("seasonal"), true),
                    readItems(root.path("market"), true),
                    readItems(root.path("tips"), false)
            );
        } catch (Exception e) {
            log.error("Failed to parse Gemini insights JSON, returning fallback", e);
            return fallback(month, location);
        }
    }

    private List<InsightItem> readItems(JsonNode array, boolean requireTitle) {

        if (array == null || !array.isArray()) {
            return Collections.emptyList();
        }
        List<InsightItem> out = new ArrayList<>();
        for (JsonNode n : array) {
            String title = requireTitle ? n.path("title").asText("") : "";
            String content = n.path("content").asText("");
            if (content.isBlank()) continue;
            out.add(new InsightItem(title, content));
        }
        return out;
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

    private InsightResponseDto fallback(String month, String location) {
        return new InsightResponseDto(
                LocalDate.now().toString(),
                month,
                location,
                List.of(
                        new InsightItem("Seasonal activity", "Plant maize, beans, or vegetables suited to " + month + " in " + location + " if rains permit."),
                        new InsightItem("Soil prep", "Add compost or manure 2 weeks before planting to improve soil structure and water retention."),
                        new InsightItem("Pest watch", "Scout for fall armyworm and aphids this month; early detection saves the crop.")
                ),
                List.of(
                        new InsightItem("Maize prices", "Maize retail remains around KES 4,500 per 90kg bag in major Kenyan markets."),
                        new InsightItem("Dairy demand", "Milk demand typically rises in dry months; expect KES 50-70/litre in urban areas."),
                        new InsightItem("Vegetable supply", "Tomato and sukuma wiki supply tightens during dry spells; good margins for irrigated farmers.")
                ),
                List.of(
                        new InsightItem("Water early", "Irrigate early morning or late evening to cut evaporation losses by 30%."),
                        new InsightItem("Crop rotation", "Rotate legumes after cereals to restore soil nitrogen naturally."),
                        new InsightItem("Record keeping", "Log every input and harvest; data beats guesswork when planning next season.")
                )
        );
    }

    private record CachedInsight(InsightResponseDto payload, long expiresAt) {
        boolean isExpired() {
            return System.currentTimeMillis() > expiresAt;
        }
    }
}
