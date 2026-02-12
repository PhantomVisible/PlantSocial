package com.plantsocial.backend.dto;

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
        LocalDateTime createdAt) {
}
