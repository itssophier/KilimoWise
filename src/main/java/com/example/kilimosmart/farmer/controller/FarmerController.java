package com.example.kilimosmart.farmer.controller;

import com.example.kilimosmart.farmer.dto.FarmerDto;
import com.example.kilimosmart.farmer.dto.RegisterFarmerInput;
import com.example.kilimosmart.farmer.service.FarmerService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.graphql.data.method.annotation.Argument;
import org.springframework.graphql.data.method.annotation.MutationMapping;
import org.springframework.graphql.data.method.annotation.QueryMapping;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Controller;
import org.springframework.validation.annotation.Validated;

import java.util.List;

@Controller
@RequiredArgsConstructor
@Validated
public class FarmerController {

    private final FarmerService farmerService;

    @MutationMapping
    public FarmerDto registerFarmer(@Argument @Valid RegisterFarmerInput input) {
        return FarmerDto.from(farmerService.registerFarmer(input));
    }

    @QueryMapping
    @PreAuthorize("isAuthenticated()")
    public List<FarmerDto> farmers() {
        return farmerService.getAllFarmers().stream()
                .map(FarmerDto::from)
                .toList();
    }

    @QueryMapping
    @PreAuthorize("isAuthenticated()")
    public FarmerDto farmer(@Argument Long id) {
        return FarmerDto.from(farmerService.getFarmerById(id));
    }
}
