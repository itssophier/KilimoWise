package com.example.kilimosmart.advisory.controller;

import com.example.kilimosmart.advisory.dto.AdvisoryInputDto;
import com.example.kilimosmart.advisory.dto.AdvisoryResponseDto;
import com.example.kilimosmart.advisory.service.AdvisoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.graphql.data.method.annotation.Argument;
import org.springframework.graphql.data.method.annotation.QueryMapping;
import org.springframework.stereotype.Controller;

@Controller
@RequiredArgsConstructor
public class AdvisoryController {

    private final AdvisoryService advisoryService;

    @QueryMapping
    public AdvisoryResponseDto analyzeProblem(@Argument AdvisoryInputDto input) {
        return advisoryService.analyzeProblem(input);
    }
}
