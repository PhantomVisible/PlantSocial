package com.plantsocial.backend.notification.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.plantsocial.backend.notification.model.NotificationType;
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
    // Lombok generates isRead() for primitive boolean, which Jackson serializes as "read".
    // @JsonProperty forces the key to "isRead" so the frontend interface matches.
    @JsonProperty("isRead")
    private boolean isRead;
    private LocalDateTime createdAt;
}
