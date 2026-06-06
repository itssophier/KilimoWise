package com.example.kilimosmart.advisory.dto;

import java.util.List;

public record AdvisoryResponseDto(
        String diagnosis,
        String confidence,
        String solution,
        List<RemedyResponseDto> remedies
) {}