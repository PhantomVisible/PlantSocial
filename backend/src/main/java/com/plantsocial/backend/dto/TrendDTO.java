package com.plantsocial.backend.dto;

import java.util.UUID;

public record TrendDTO(
        UUID postId,
        String topic,
        String category,
        String stats) {
}
