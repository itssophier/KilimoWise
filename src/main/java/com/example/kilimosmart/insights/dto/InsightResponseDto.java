package com.example.kilimosmart.insights.dto;

import java.util.List;

public record InsightResponseDto(
        String generatedFor,
        String month,
        String location,
        List<InsightItem> seasonal,
        List<InsightItem> market,
        List<InsightItem> tips
) {
    public record InsightItem(String title, String content) {}
}
