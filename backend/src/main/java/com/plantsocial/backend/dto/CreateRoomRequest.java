package com.plantsocial.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.List;
import java.util.UUID;

public record CreateRoomRequest(
        @NotBlank(message = "Room name is required") @Size(max = 100) String name,

        List<UUID> memberIds) {
}
