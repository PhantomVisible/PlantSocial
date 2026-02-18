package com.plantsocial.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserHoverCardDTO {
    private UUID id;
    private String fullName;
    private String username;
    private String bio;
    private String profilePictureUrl;

    private long followerCount;
    private long followingCount;

    @JsonProperty("isFollowing")
    private boolean isFollowing;
}
