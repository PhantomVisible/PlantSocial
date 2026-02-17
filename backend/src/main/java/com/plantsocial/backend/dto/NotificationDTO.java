package com.plantsocial.backend.dto;

import com.plantsocial.backend.model.NotificationType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationDTO {
    private UUID id;
    private NotificationType type;
    private String content;
    private String senderName;
    private String senderHandle;
    private String senderProfilePicture;
    private UUID relatedId;
    private boolean isRead;
    private LocalDateTime createdAt;
}
