package com.example.kilimosmart.advisory.service;

import com.example.kilimosmart.advisory.dto.AdvisoryInputDto;
import com.example.kilimosmart.advisory.dto.AdvisoryResponseDto;
import com.example.kilimosmart.advisory.model.Advisory;
import com.example.kilimosmart.advisory.repository.AdvisoryRepository;
import com.example.kilimosmart.farmer.entity.Farmer;
import com.example.kilimosmart.farmer.repository.FarmerRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AdvisoryService {

    private final AdvisoryRepository advisoryRepository;
    private final FarmerRepository farmerRepository;
    private final GeminiServiceAPI geminiServiceAPI;

    public AdvisoryResponseDto analyzeProblem(AdvisoryInputDto input) {

        Farmer farmer = farmerRepository.findById(input.farmerId())
                .orElseThrow(() -> new RuntimeException("Farmer not found"));

        AdvisoryResponseDto response = geminiServiceAPI.analyze(
                input.type().name(),   // ✅ FIXED
                input.description(),
                input.imageBase64()
        );

        Advisory advisory = Advisory.builder()
                .farmer(farmer)
                .type(input.type())   // ✅ FIXED
                .problemDescription(input.description())
                .aiResponse(response.solution()) // ✅ FIXED (record access)
                .build();

        advisoryRepository.save(advisory);

        return response;
    }
}