package com.example.kilimosmart.farmer.entity;

import com.example.kilimosmart.expense.entity.Expenses;
import jakarta.validation.constraints.Past;
import com.fasterxml.jackson.annotation.JsonManagedReference;


import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.Period;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "farmer")
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class Farmer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)

    private Long id;
    private String firstName;
    private String lastName;
    private String phoneNumber;
    @Past
    private LocalDate dob;

    @Transient
    public Integer getAge() {
        return dob == null ? null :
                Period.between(dob, LocalDate.now()).getYears();
    }

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Gender gender;

    private String location;

    @JsonManagedReference
    @OneToMany(
            mappedBy = "farmer",
            cascade = CascadeType.ALL,
            orphanRemoval = true
    )
    private List<Expenses> expenses = new ArrayList<>();

    public enum Gender {
        MALE,
        FEMALE,
        OTHER
    }

}
