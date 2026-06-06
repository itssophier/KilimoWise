package com.example.kilimosmart.expense.service;

import com.example.kilimosmart.config.errors.ApiException;
import com.example.kilimosmart.expense.dto.ExpenseStatsDto;
import com.example.kilimosmart.expense.dto.ExpenseStatsDto.MonthlyTotal;
import com.example.kilimosmart.expense.dto.ExpensesInput;
import com.example.kilimosmart.expense.entity.Expenses;
import com.example.kilimosmart.expense.repository.ExpensesRepository;
import com.example.kilimosmart.farmer.entity.Farmer;
import com.example.kilimosmart.farmer.repository.FarmerRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class ExpensesService {

    private final ExpensesRepository expensesRepository;
    private final FarmerRepository farmerRepository;

    public Expenses addExpense(ExpensesInput input) {

        Farmer farmer = farmerRepository.findById(input.farmerId())
                .orElseThrow(() -> ApiException.notFound("Farmer"));

        LocalDate date = input.expenseDate() != null ? input.expenseDate() : LocalDate.now();

        Expenses expense = Expenses.builder()
                .category(input.category())
                .amount(input.amount())
                .description(input.description())
                .expenseDate(date.atStartOfDay())
                .farmer(farmer)
                .build();

        return expensesRepository.save(expense);
    }

    public List<Expenses> getExpensesByFarmer(Long farmerId) {
        return expensesRepository.findByFarmerId(farmerId);
    }

    public ExpenseStatsDto getExpenseStats(Long farmerId) {

        List<Expenses> all = expensesRepository.findByFarmerId(farmerId);

        YearMonth thisMonth = YearMonth.now();
        YearMonth lastMonth = thisMonth.minusMonths(1);

        double totalAllTime = 0d;
        double totalThisMonth = 0d;
        double totalLastMonth = 0d;
        Map<String, Double> byCategory = new LinkedHashMap<>();
        Map<YearMonth, Double> monthly = new LinkedHashMap<>();

        for (Expenses e : all) {
            double amt = e.getAmount() == null ? 0d : e.getAmount();
            totalAllTime += amt;

            String cat = e.getCategory() != null ? e.getCategory().name() : "OTHER";
            byCategory.merge(cat, amt, Double::sum);

            LocalDate d = e.getExpenseDate() != null ? e.getExpenseDate().toLocalDate() : null;
            if (d != null) {
                YearMonth ym = YearMonth.from(d);
                monthly.merge(ym, amt, Double::sum);
                if (ym.equals(thisMonth)) totalThisMonth += amt;
                else if (ym.equals(lastMonth)) totalLastMonth += amt;
            }
        }

        double monthChange = 0d;
        if (totalLastMonth > 0d) {
            monthChange = ((totalThisMonth - totalLastMonth) / totalLastMonth) * 100d;
        } else if (totalThisMonth > 0d) {
            monthChange = 100d;
        }

        String topCategory = null;
        double topAmount = 0d;
        for (Map.Entry<String, Double> entry : byCategory.entrySet()) {
            if (entry.getValue() > topAmount) {
                topAmount = entry.getValue();
                topCategory = entry.getKey();
            }
        }

        List<MonthlyTotal> trend = new ArrayList<>();
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("MMM", Locale.ENGLISH);
        YearMonth cursor = thisMonth.minusMonths(5);
        for (int i = 0; i < 6; i++) {
            double v = monthly.getOrDefault(cursor, 0d);
            trend.add(new MonthlyTotal(cursor.format(fmt), v));
            cursor = cursor.plusMonths(1);
        }

        return new ExpenseStatsDto(
                round2(totalAllTime),
                round2(totalThisMonth),
                round2(totalLastMonth),
                round2(monthChange),
                topCategory,
                round2(topAmount),
                byCategory,
                trend
        );
    }

    private double round2(double v) {
        return Math.round(v * 100d) / 100d;
    }
}
