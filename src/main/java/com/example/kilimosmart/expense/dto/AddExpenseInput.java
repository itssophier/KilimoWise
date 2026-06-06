package com.example.kilimosmart.expense.dto;

import com.example.kilimosmart.expense.entity.Expenses;

import java.time.LocalDate;

public record AddExpenseInput(
        Long farmerId,
        Expenses.Category category,
        Double amount,
        String description,
        LocalDate expenseDate
) {
}
