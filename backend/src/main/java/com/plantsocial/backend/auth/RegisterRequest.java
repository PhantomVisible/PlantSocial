package com.plantsocial.backend.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import jakarta.validation.constraints.Pattern;

public record RegisterRequest(
        @NotBlank(message = "Full name is required") @Pattern(regexp = "^[a-zA-Z\\s]+$", message = "Full name must contain only letters and spaces") String fullName,

        @NotBlank(message = "Username is required") @Size(min = 3, max = 20, message = "Username must be between 3 and 20 characters") @Pattern(regexp = "^[a-zA-Z0-9_]+$", message = "Username must contain only letters, numbers, and underscores") String username,

        @NotBlank(message = "Email is required") @Email(message = "Email should be valid") String email,

        @NotBlank(message = "Password is required") @Size(min = 6, message = "Password must be at least 6 characters") String password) {
}
