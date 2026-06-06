
package com.example.kilimosmart.advisory.dto;

import com.example.kilimosmart.advisory.model.Advisory;

public record AdvisoryInput(
        Long farmerId,
        Advisory.AdvisoryType type,
        String description,
        String imageBase64
) {
}
