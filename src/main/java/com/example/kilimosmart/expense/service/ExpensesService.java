package com.example.kilimosmart.expense.service;

import com.example.kilimosmart.expense.dto.AddExpenseInput;
import com.example.kilimosmart.expense.entity.Expenses;
import com.example.kilimosmart.expense.repository.ExpensesRepository;
import com.example.kilimosmart.farmer.entity.Farmer;
import com.example.kilimosmart.farmer.repository.FarmerRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ExpensesService {

    private final ExpensesRepository expensesRepository;
    private final FarmerRepository farmerRepository;

    public Expenses addExpense(AddExpenseInput input) {

        Farmer farmer = farmerRepository.findById(input.farmerId())
                .orElseThrow(() -> new RuntimeException("Farmer not found"));

        Expenses expense = Expenses.builder()
                .category(input.category())
                .amount(input.amount())
                .description(input.description())
                .expenseDate(
                        LocalDateTime.from(input.expenseDate() != null
                                ? input.expenseDate()
                                : LocalDate.now())
                )
                .farmer(farmer)
                .build();

        return expensesRepository.save(expense);
    }

    public List<Expenses> getExpensesByFarmer(Long farmerId) {
        return expensesRepository.findByFarmerId(farmerId);
    }
}