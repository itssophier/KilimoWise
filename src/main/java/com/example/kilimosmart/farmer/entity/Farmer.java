package com.example.kilimosmart.farmer.entity;

import jakarta.validation.constraints.Past;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.Period;

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
    private Integer age;

    @Transient
    public Integer getAge() {
        return dob == null ? null :
                Period.between(dob, LocalDate.now()).getYears();
    }

    private String gender;
    private String location;

}
