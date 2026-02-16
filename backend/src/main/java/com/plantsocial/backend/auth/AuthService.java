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
}
