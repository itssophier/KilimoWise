package com.example.kilimosmart.auth.dto;

public record LoginRequest(
        String phone,
        String password
) {
}