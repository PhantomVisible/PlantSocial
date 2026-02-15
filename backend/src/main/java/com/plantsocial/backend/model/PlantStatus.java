package com.plantsocial.backend.model;

public enum PlantStatus {
    SEED,
    GERMINATED,
    VEGETATIVE,
    FLOWERING,
    FRUITING,
    HARVESTED,
    DEAD,
    // Legacy support to prevent runtime crashes on existing data
    ALIVE
}
