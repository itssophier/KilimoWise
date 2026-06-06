package com.example.kilimosmart.expense.entity;

import com.fasterxml.jackson.annotation.JsonBackReference;

import com.example.kilimosmart.farmer.entity.Farmer;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "expenses")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Expenses {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Category category;

    private Double amount;
    private String description;
    @CreationTimestamp
    private LocalDateTime expenseDate;

    @JsonBackReference
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "farmer_id")
    private Farmer farmer;

    public enum Category {
        SEEDS,
        FERTILIZER,
        PESTICIDES,
        VETERINARY,
        LABOR,
        TRANSPORT,
        OTHER
    }
}
