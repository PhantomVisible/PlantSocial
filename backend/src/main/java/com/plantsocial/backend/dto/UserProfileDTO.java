package com.plantsocial.backend.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.time.LocalDateTime;
import java.util.UUID;

public record UserProfileDTO(
        UUID id,
        String fullName,
        String username,
        String bio,
        String location,
        String profilePictureUrl,
        LocalDateTime joinDate,
<<<<<<< Updated upstream
        long postCount) {
=======
        long postCount,
        long followerCount,
        long followingCount,
        @JsonProperty("isFollowing") boolean isFollowing) {
>>>>>>> Stashed changes
}
