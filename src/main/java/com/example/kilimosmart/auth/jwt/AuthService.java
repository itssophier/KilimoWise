package com.example.kilimosmart.auth.jwt;

import com.example.kilimosmart.auth.dto.LoginRequest;
import com.example.kilimosmart.auth.dto.LoginResponse;
import com.example.kilimosmart.farmer.entity.Farmer;
import com.example.kilimosmart.farmer.repository.FarmerRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final FarmerRepository farmerRepository;
    private final JwtService jwtService;
    private final PasswordEncoder passwordEncoder;

    public LoginResponse login(LoginRequest request) {

        Farmer farmer = farmerRepository.findByPhoneNumber(request.phoneNumber())
                .orElseThrow(() -> new RuntimeException("Invalid credentials"));

        if (!passwordEncoder.matches(request.password(), farmer.getPassword())) {
            throw new RuntimeException("Invalid credentials");
        }

        String token = jwtService.generateToken(farmer.getId());

        return new LoginResponse(
                token,
                farmer.getId()
        );
    }
}

