package com.example.kilimosmart.expense.dto;

import java.util.List;
import java.util.Map;

public record ExpenseStatsDto(
        double totalAllTime,
        double totalThisMonth,
        double totalLastMonth,
        double monthChangePercent,
        String topCategory,
        double topCategoryAmount,
        Map<String, Double> byCategory,
        List<MonthlyTotal> monthlyTrend
) {
    public record MonthlyTotal(String month, double total) {}
}
