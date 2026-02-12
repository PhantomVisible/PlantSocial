package com.plantsocial.backend.dto;

import java.time.LocalDateTime;
import java.util.UUID;

public record UserProfileDTO(
        UUID id,
        String fullName,
        String bio,
        String location,
        LocalDateTime joinDate,
        long postCount) {
}
