package com.example.kilimosmart.advisory.controller;

import com.example.kilimosmart.advisory.dto.AdvisoryInput;
import com.example.kilimosmart.advisory.dto.AdvisoryResponseDto;
import com.example.kilimosmart.advisory.service.AdvisoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.graphql.data.method.annotation.Argument;
import org.springframework.graphql.data.method.annotation.QueryMapping;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Controller;

@Controller
@RequiredArgsConstructor
public class AdvisoryController {

    private final AdvisoryService advisoryService;

    @QueryMapping
    @PreAuthorize("isAuthenticated()")
    public AdvisoryResponseDto analyzeProblem(@Argument AdvisoryInput input) {
        return advisoryService.analyzeProblem(input);
    }
}
