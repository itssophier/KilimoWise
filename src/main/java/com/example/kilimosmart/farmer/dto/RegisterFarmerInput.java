package com.example.kilimosmart.farmer.dto;

import com.example.kilimosmart.farmer.entity.Farmer;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Past;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

public record RegisterFarmerInput(
        @NotBlank @Size(max = 50) String firstName,
        @NotBlank @Size(max = 50) String lastName,
        @NotBlank @Size(max = 20) String phoneNumber,
        @NotNull @Past LocalDate dob,
        @NotNull Farmer.Gender gender,
        @Size(max = 100) String location,
        @NotBlank @Size(min = 6, max = 100) String password
) {
}
