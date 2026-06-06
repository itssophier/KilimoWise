package com.example.kilimosmart.auth.controller;

import com.example.kilimosmart.auth.dto.LoginRequest;
import com.example.kilimosmart.auth.dto.LoginResponse;
import com.example.kilimosmart.auth.jwt.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.graphql.data.method.annotation.Argument;
import org.springframework.graphql.data.method.annotation.MutationMapping;
import org.springframework.stereotype.Controller;

@Controller
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @MutationMapping
    public LoginResponse login(@Argument LoginRequest input) {
        return authService.login(input);
    }
}