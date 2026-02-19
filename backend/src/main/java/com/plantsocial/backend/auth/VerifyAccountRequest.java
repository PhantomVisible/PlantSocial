package com.plantsocial.backend.auth;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record VerifyAccountRequest(
        @NotBlank(message = "Email is required") String email,

        @NotBlank(message = "Verification code is required") @Size(min = 6, max = 6, message = "Code must be 6 digits") String code) {
}
