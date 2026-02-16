package com.plantsocial.backend.dto;

import java.time.LocalDateTime;
import java.util.UUID;

public record CommentResponse(
                UUID id,
                String content,
                String authorName,
                UUID authorId,
                LocalDateTime createdAt,
                long replyCount,
                String authorProfilePictureUrl) {
}
