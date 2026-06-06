package com.example.kilimosmart.expense.dto;

import com.example.kilimosmart.expense.entity.Expenses;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

public record ExpensesInput(
        @NotNull Long farmerId,
        @NotNull Expenses.Category category,
        @NotNull @Positive Double amount,
        @NotNull @Size(max = 200) String description,
        LocalDate expenseDate
) {
}
