package com.plantsocial.backend.dto;

import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record UpdateProfileRequest(
        @Pattern(regexp = "^[a-zA-Z0-9_]{3,20}$", message = "Username must be 3-20 characters and alphanumeric") String username,

        @Size(max = 100, message = "Full name too long") String fullName,

        @Size(max = 500, message = "Bio too long") String bio) {
}
