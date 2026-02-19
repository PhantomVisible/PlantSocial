package com.plantsocial.backend.dto;

import java.util.UUID;

public record ReportDTO(UUID postId, String reason, String description, boolean blockUser) {
}
