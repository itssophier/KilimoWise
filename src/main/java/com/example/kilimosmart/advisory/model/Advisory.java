package com.example.kilimosmart.advisory.model;

import com.example.kilimosmart.farmer.entity.Farmer;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Advisory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    private Farmer farmer;

    public enum AdvisoryType {
        CROP,
        ANIMAL
    }

    @Enumerated(EnumType.STRING)
    private AdvisoryType type;

    private String problemDescription;

    @Column(columnDefinition = "TEXT")
    private String aiResponse;
}