package com.plantsocial.backend.dto;

import java.time.LocalDateTime;
import java.util.UUID;

public record ChatMessageDTO(
        UUID id,
        UUID roomId,
        UUID senderId,
        String senderUsername,
        String senderFullName,
        String content,
        String messageType,
        String mediaUrl,
        LocalDateTime createdAt) {
}
