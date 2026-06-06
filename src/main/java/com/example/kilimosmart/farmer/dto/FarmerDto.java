package com.example.kilimosmart.farmer.dto;

import com.example.kilimosmart.farmer.entity.Farmer;

import java.time.LocalDate;

public record FarmerDto(
        Long id,
        String firstName,
        String lastName,
        String phoneNumber,
        LocalDate dob,
        Integer age,
        Farmer.Gender gender,
        String location
) {
    public static FarmerDto from(Farmer farmer) {
        return new FarmerDto(
                farmer.getId(),
                farmer.getFirstName(),
                farmer.getLastName(),
                farmer.getPhoneNumber(),
                farmer.getDob(),
                farmer.getAge(),
                farmer.getGender(),
                farmer.getLocation()
        );
    }
}
