package com.example.kilimosmart.farmer.repository;

import com.example.kilimosmart.farmer.entity.Farmer;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;


public interface FarmerRepository extends JpaRepository<Farmer, Long> {

    List<Farmer> findFarmerBy(Long farmerId);


}
