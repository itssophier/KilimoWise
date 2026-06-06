package com.example.kilimosmart.insights.controller;

import com.example.kilimosmart.insights.dto.InsightResponseDto;
import com.example.kilimosmart.insights.service.InsightService;
import lombok.RequiredArgsConstructor;
import org.springframework.graphql.data.method.annotation.Argument;
import org.springframework.graphql.data.method.annotation.QueryMapping;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Controller;

@Controller
@RequiredArgsConstructor
public class InsightController {

    private final InsightService insightService;

    @QueryMapping
    @PreAuthorize("isAuthenticated()")
    public InsightResponseDto getInsights(@Argument Long farmerId) {
        return insightService.getInsights(farmerId);
    }
}
