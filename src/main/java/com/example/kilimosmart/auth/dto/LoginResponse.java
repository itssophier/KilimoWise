package com.example.kilimosmart.auth.dto;

public record LoginResponse(
        String token,
        Long farmerId,
        String name
) {}