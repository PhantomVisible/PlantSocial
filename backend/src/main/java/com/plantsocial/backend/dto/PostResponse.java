package com.plantsocial.backend.dto;

import java.time.LocalDateTime;
import java.util.UUID;

public record PostResponse(
                UUID id,
                String content,
                String imageUrl,
                String authorName,
                UUID authorId,
                LocalDateTime createdAt,
                long likesCount,
                boolean likedByCurrentUser) {
}
