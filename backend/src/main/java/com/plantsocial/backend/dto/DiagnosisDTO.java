package com.plantsocial.backend.dto;

import java.util.List;

public record DiagnosisDTO(
        String status,
        String diseaseName,
        Integer confidence,
        List<String> treatmentSteps) {
}
