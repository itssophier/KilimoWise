
package com.example.kilimosmart.advisory.dto;

import com.example.kilimosmart.advisory.model.Advisory;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record AdvisoryInput(
        @NotNull Long farmerId,
        @NotNull Advisory.AdvisoryType type,
        @NotNull @Size(min = 3, max = 4000) String description,
        @Size(max = 12_000_000) String imageBase64
) {
}
