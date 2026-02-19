package com.plantsocial.backend.auth;

import com.plantsocial.backend.config.JwtService;
import com.plantsocial.backend.user.Role;
import com.plantsocial.backend.user.User;
import com.plantsocial.backend.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository repository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;

    public AuthenticationResponse register(RegisterRequest request) {
        if (repository.existsByEmail(request.email())) {
            throw new IllegalArgumentException("Email already in use");
        }
        if (repository.existsByUsername(request.username())) {
            throw new IllegalArgumentException("Username already taken");
        }

        var user = User.builder()
                .fullName(request.fullName())
                .username(request.username())
                .email(request.email())
                .password(passwordEncoder.encode(request.password()))
                .role(Role.USER)
                .build();
        repository.save(user);
        var jwtToken = jwtService.generateToken(buildClaims(user), user);
        return new AuthenticationResponse(jwtToken);
    }

    public AuthenticationResponse authenticate(AuthenticationRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.email(),
                        request.password()));
        var user = repository.findByEmail(request.email())
                .orElseThrow();
        var jwtToken = jwtService.generateToken(buildClaims(user), user);
        return new AuthenticationResponse(jwtToken);
    }

    private Map<String, Object> buildClaims(User user) {
        java.util.HashMap<String, Object> claims = new java.util.HashMap<>();
        claims.put("userId", user.getId().toString());
        claims.put("fullName", user.getFullName());
        claims.put("username", user.getHandle());
        if (user.getProfilePictureUrl() != null) {
            claims.put("profilePictureUrl", user.getProfilePictureUrl());
        }
        return claims;
    }

    public void requestPasswordReset(ForgotPasswordRequest request) {
        var user = repository.findByEmail(request.email())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        String token = java.util.UUID.randomUUID().toString();
        user.setResetPasswordToken(token);
        user.setResetPasswordTokenExpiry(java.time.LocalDateTime.now().plusHours(1));
        repository.save(user);

        // Mock Email
        System.out.println("==========================================");
        System.out.println("PASSWORD RESET REQUEST");
        System.out.println("Email: " + user.getEmail());
        System.out.println("Token: " + token);
        System.out.println("Link: http://localhost:4200/reset-password?token=" + token);
        System.out.println("==========================================");
    }

    public void resetPassword(ResetPasswordRequest request) {
        var user = repository.findByResetPasswordToken(request.token())
                .orElseThrow(() -> new IllegalArgumentException("Invalid token"));

        if (user.getResetPasswordTokenExpiry().isBefore(java.time.LocalDateTime.now())) {
            throw new IllegalArgumentException("Token expired");
        }

        user.setPassword(passwordEncoder.encode(request.newPassword()));
        user.setResetPasswordToken(null);
        user.setResetPasswordTokenExpiry(null);
        repository.save(user);
    }
}
