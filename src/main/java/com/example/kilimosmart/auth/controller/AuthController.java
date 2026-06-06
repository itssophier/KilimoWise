package com.example.kilimosmart.auth.controller;

import com.example.kilimosmart.auth.dto.LoginRequest;
import com.example.kilimosmart.auth.dto.LoginResponse;
import com.example.kilimosmart.auth.jwt.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.graphql.data.method.annotation.Argument;
import org.springframework.graphql.data.method.annotation.MutationMapping;
import org.springframework.stereotype.Controller;
import org.springframework.validation.annotation.Validated;

@Controller
@RequiredArgsConstructor
@Validated
public class AuthController {

    private final AuthService authService;

    @MutationMapping
    public LoginResponse login(@Argument @Valid LoginRequest input) {
        return authService.login(input);
    }
}