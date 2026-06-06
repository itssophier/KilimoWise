package com.example.kilimosmart.advisory.service;

import com.example.kilimosmart.advisory.dto.AdvisoryResponseDto;
import com.example.kilimosmart.advisory.model.Advisory;
import com.example.kilimosmart.advisory.repository.AdvisoryRepository;
import com.example.kilimosmart.config.errors.ApiException;
import com.example.kilimosmart.expense.dto.ExpenseStatsDto;
import com.example.kilimosmart.expense.dto.ExpenseStatsDto.MonthlyTotal;
import com.example.kilimosmart.expense.entity.Expenses;
import com.example.kilimosmart.expense.repository.ExpensesRepository;
import com.example.kilimosmart.expense.service.ExpensesService;
import com.example.kilimosmart.farmer.entity.Farmer;
import com.example.kilimosmart.farmer.repository.FarmerRepository;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class ServiceUnitTest {

    @Test
    void advisoryServicePersistsAndReturnsResponse() {
        FarmerRepository farmerRepo = mock(FarmerRepository.class);
        AdvisoryRepository advisoryRepo = mock(AdvisoryRepository.class);
        GeminiServiceAPI gemini = mock(GeminiServiceAPI.class);

        Farmer farmer = Farmer.builder().id(7L).firstName("A").lastName("B").build();
        when(farmerRepo.findById(7L)).thenReturn(Optional.of(farmer));
        when(advisoryRepo.save(any(Advisory.class))).thenAnswer(inv -> inv.getArgument(0));

        AdvisoryResponseDto response = new AdvisoryResponseDto(
                "Nitrogen deficiency",
                "0.85",
                "Apply urea",
                List.of()
        );
        when(gemini.analyze(any(Farmer.class), anyString(), anyString(), any())).thenReturn(response);

        AdvisoryService service = new AdvisoryService(advisoryRepo, farmerRepo, gemini);

        AdvisoryResponseDto out = service.analyzeProblem(
                new com.example.kilimosmart.advisory.dto.AdvisoryInput(
                        7L, Advisory.AdvisoryType.CROP, "yellow leaves", null
                )
        );

        assertNotNull(out);
        assertEquals("Nitrogen deficiency", out.diagnosis());
        verify(advisoryRepo).save(any(Advisory.class));
    }

    @Test
    void advisoryServiceThrowsWhenFarmerMissing() {
        FarmerRepository farmerRepo = mock(FarmerRepository.class);
        AdvisoryRepository advisoryRepo = mock(AdvisoryRepository.class);
        GeminiServiceAPI gemini = mock(GeminiServiceAPI.class);
        when(farmerRepo.findById(99L)).thenReturn(Optional.empty());

        AdvisoryService service = new AdvisoryService(advisoryRepo, farmerRepo, gemini);

        assertThrows(ApiException.class, () -> service.analyzeProblem(
                new com.example.kilimosmart.advisory.dto.AdvisoryInput(
                        99L, Advisory.AdvisoryType.CROP, "x", null
                )
        ));
    }

    @Test
    void expensesServiceComputesStats() {
        FarmerRepository farmerRepo = mock(FarmerRepository.class);
        ExpensesRepository expensesRepo = mock(ExpensesRepository.class);

        Farmer farmer = Farmer.builder().id(1L).build();
        when(farmerRepo.findById(1L)).thenReturn(Optional.of(farmer));

        Expenses e1 = Expenses.builder()
                .id(1L).category(Expenses.Category.SEEDS).amount(1000.0)
                .expenseDate(LocalDateTime.now().withDayOfMonth(5))
                .build();
        Expenses e2 = Expenses.builder()
                .id(2L).category(Expenses.Category.SEEDS).amount(500.0)
                .expenseDate(LocalDateTime.now().minusMonths(1).withDayOfMonth(10))
                .build();
        when(expensesRepo.findByFarmerId(1L)).thenReturn(List.of(e1, e2));

        ExpensesService service = new ExpensesService(expensesRepo, farmerRepo);
        ExpenseStatsDto stats = service.getExpenseStats(1L);

        assertNotNull(stats);
        assertEquals(1500.0, stats.totalAllTime());
        assertEquals(1000.0, stats.totalThisMonth());
        assertEquals(500.0, stats.totalLastMonth());
        assertEquals("SEEDS", stats.topCategory());
        assertNotNull(stats.monthlyTrend());
        assertEquals(6, stats.monthlyTrend().size());
    }
}
