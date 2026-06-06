package com.example.kilimosmart.farmer.service;

import com.example.kilimosmart.config.errors.ApiException;
import com.example.kilimosmart.farmer.dto.RegisterFarmerInput;
import com.example.kilimosmart.farmer.entity.Farmer;
import com.example.kilimosmart.farmer.repository.FarmerRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class FarmerService {

    private final FarmerRepository farmerRepository;
    private final PasswordEncoder passwordEncoder;

    public Farmer registerFarmer(RegisterFarmerInput input) {
        Farmer farmer = Farmer.builder()
                .firstName(input.firstName())
                .lastName(input.lastName())
                .phoneNumber(input.phoneNumber())
                .dob(input.dob())
                .gender(input.gender())
                .location(input.location())
                .password(passwordEncoder.encode(input.password()))
                .build();

        return farmerRepository.save(farmer);
    }

    public List<Farmer> getAllFarmers() {
        return farmerRepository.findAll();
    }

    public Farmer getFarmerById(Long farmerId) {
        return farmerRepository.findById(farmerId)
                .orElseThrow(() -> ApiException.notFound("Farmer"));
    }
}
