package com.example.kilimosmart.expense.repository;

import com.example.kilimosmart.expense.entity.Expenses;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ExpensesRepository  extends JpaRepository<Expenses, Long> {

    List<Expenses> findByFarmerId(Long farmerId);


}
