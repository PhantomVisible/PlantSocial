package com.plantsocial.backend.dto;

import com.plantsocial.backend.dto.plantid.PlantIdSuggestion;

import java.util.List;

public record PlantIdentificationDTO(
        String topMatch,
        double confidence,
        List<PlantIdSuggestion> suggestions) {}
