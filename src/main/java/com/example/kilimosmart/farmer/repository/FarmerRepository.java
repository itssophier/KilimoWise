package com.example.kilimosmart.farmer.repository;

import com.example.kilimosmart.farmer.entity.Farmer;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;


public interface FarmerRepository extends JpaRepository<Farmer, Long> {

    Optional<Farmer> findByPhoneNumber(String phoneNumber);
}
