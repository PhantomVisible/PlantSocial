package com.plantsocial.backend.security;

import com.plantsocial.backend.user.Role;
import com.plantsocial.backend.user.User;
import com.plantsocial.backend.user.UserRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Slf4j
@RequiredArgsConstructor
public class JwtUserSyncFilter extends OncePerRequestFilter {

    private final UserRepository userRepository;

    // In-Memory Verification Cache to prevent DB checks on every request
    private final Set<UUID> verifiedUsers = ConcurrentHashMap.newKeySet();

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication instanceof JwtAuthenticationToken jwtToken) {
            Jwt jwt = jwtToken.getToken();
            String sub = jwt.getSubject();

            if (sub != null) {
                try {
                    UUID userId = UUID.fromString(sub);

                    // Check cache first before hitting the DB
                    if (!verifiedUsers.contains(userId)) {
                        if (!userRepository.existsById(userId)) {
                            log.info("New user detected from JWT. Provisioning user with ID: {}", userId);
                            syncNewUser(userId, jwt);
                        } else {
                            // User exists in DB but wasn't in cache, add to cache
                            verifiedUsers.add(userId);
                        }
                    }
                } catch (IllegalArgumentException e) {
                    log.warn("Invalid UUID format in JWT sub claim: {}", sub);
                }
            }
        }

        filterChain.doFilter(request, response);
    }

    private void syncNewUser(UUID userId, Jwt jwt) {
        String email = jwt.getClaimAsString("email");
        String username = jwt.getClaimAsString("preferred_username");
        String givenName = jwt.getClaimAsString("given_name");
        String familyName = jwt.getClaimAsString("family_name");

        // Provide fallbacks in case claims are missing
        if (username == null) username = "user_" + userId.toString().substring(0, 8);
        if (email == null) email = username + "@example.com";
        if (givenName == null) givenName = "Plant";
        if (familyName == null) familyName = "Lover";

        User newUser = User.builder()
                .id(userId)
                .email(email)
                .username(username)
                .fullName(givenName + " " + familyName)
                .password("OIDC_MANAGED") // Password is managed by Keycloak
                .role(Role.USER)
                .enabled(true)
                .build();

        try {
            userRepository.save(newUser);
            verifiedUsers.add(userId);
            log.info("Successfully provisioned new user: {}", username);
        } catch (DataIntegrityViolationException e) {
            // Handle race condition if a concurrent thread already provisioned the user
            log.warn("User already provisioned by concurrent thread: {}", userId);
            verifiedUsers.add(userId);
        }
    }
}
