package com.plantsocial.backend.chat.dto;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public record ChatRoomDTO(
        UUID id,
        String name,
        String type,
        List<MemberInfo> members,
        ChatMessageDTO lastMessage,
        LocalDateTime createdAt) {
    public record MemberInfo(
            UUID userId,
            String username,
            String fullName,
            String role) {
    }
}
