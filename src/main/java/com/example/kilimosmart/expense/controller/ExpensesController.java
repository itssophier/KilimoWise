package com.example.kilimosmart.expense.controller;

import com.example.kilimosmart.expense.dto.AddExpenseInput;
import com.example.kilimosmart.expense.entity.Expenses;
import com.example.kilimosmart.expense.service.ExpensesService;
import org.springframework.graphql.data.method.annotation.Argument;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.graphql.data.method.annotation.MutationMapping;
import org.springframework.graphql.data.method.annotation.QueryMapping;
import org.springframework.stereotype.Controller;

import java.util.List;

@Controller
public class ExpensesController {
    @Autowired
    private ExpensesService expensesService;

    @MutationMapping(name = "addExpense")
    public Expenses addExpense(@Argument AddExpenseInput input) {
        return expensesService.addExpense(input);
    }

    @QueryMapping(name = "getExpense")
    public List<Expenses> expenses(@Argument Long farmerId) {
        return expensesService.getExpensesByFarmer(farmerId);
    }
}
