package com.example.kilimosmart.advisory.dto;

public record RemedyResponseDto(

        String name,
        String estimatedPrice,
        String amountNeeded,
        String availabilityLocation
) {
}
