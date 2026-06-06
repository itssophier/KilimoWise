package com.example.kilimosmart.auth.dto;

public record LoginRequest(
        String phoneNumber,
        String password
) {
}