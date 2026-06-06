package com.example.kilimosmart.advisory.repository;

import com.example.kilimosmart.advisory.model.Advisory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AdvisoryRepository extends JpaRepository<Advisory, Long> {

    List<Advisory> findByFarmerId(Long farmerId);

}
