package com.plantsocial.backend.dto;

import java.time.LocalDateTime;
import java.util.UUID;

public record UserProfileDTO(
        UUID id,
        String fullName,
        String username,
        String bio,
        String location,
        String profilePictureUrl,
        String coverPictureUrl,
        LocalDateTime joinDate,
        long postCount,
        long followerCount,
        long followingCount,
        boolean isFollowing) {
}
