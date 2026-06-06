package com.example.kilimosmart.farmer.controller;

import com.example.kilimosmart.farmer.dto.RegisterFarmerInput;
import com.example.kilimosmart.farmer.entity.Farmer;
import com.example.kilimosmart.farmer.service.FarmerService;
import lombok.RequiredArgsConstructor;
import org.springframework.graphql.data.method.annotation.Argument;
import org.springframework.graphql.data.method.annotation.MutationMapping;
import org.springframework.graphql.data.method.annotation.QueryMapping;
import org.springframework.stereotype.Controller;

import java.util.List;

@Controller
@RequiredArgsConstructor
public class FarmerController {

    private final FarmerService farmerService;

    @MutationMapping
    public Farmer registerFarmer(@Argument RegisterFarmerInput input) {
        return farmerService.registerFarmer(input);
    }

    @QueryMapping
    public List<Farmer> farmers() {
        return farmerService.getAllFarmers();
    }

    @QueryMapping
    public Farmer farmer(@Argument Long id) {
        return farmerService.getFarmerById(id);
    }
}