package com.plantsocial.backend.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

public record PlantResponse(
        UUID id,
        String nickname,
        String species,
        String imageUrl,
        String status,
        UUID ownerId,
        String ownerName,
        @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd") LocalDate plantedDate,
        @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd") LocalDate harvestDate,
        boolean isVerified,
        LocalDateTime createdAt) {
}
