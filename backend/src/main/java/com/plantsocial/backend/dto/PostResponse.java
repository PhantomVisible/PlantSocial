package com.plantsocial.backend.dto;

import java.time.LocalDateTime;
import java.util.UUID;

public record PostResponse(
        UUID id,
        String content,
        String imageUrl,

        String authorName,
        String authorUsername,
        UUID authorId,
        LocalDateTime createdAt,
        long likesCount,
        long commentCount,
        boolean likedByCurrentUser,
        UUID plantId,
        String plantNickname,
        String plantTag,
        String authorProfilePictureUrl) {
}
