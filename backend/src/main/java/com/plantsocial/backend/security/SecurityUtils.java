package com.plantsocial.backend.security;

import com.plantsocial.backend.user.User;
import com.plantsocial.backend.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Component
@RequiredArgsConstructor
public class SecurityUtils {

    private final UserRepository userRepository;

    /**
     * Resolves the currently authenticated user from the Keycloak JWT sub claim.
     * Throws if no valid JWT authentication is present.
     */
    public User getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth instanceof JwtAuthenticationToken jwtAuth) {
            UUID userId = UUID.fromString(jwtAuth.getToken().getSubject());
            return userRepository.findById(userId)
                    .orElseThrow(() -> new UsernameNotFoundException("User not found: " + userId));
        }
        throw new UsernameNotFoundException("No JWT authentication found in security context");
    }

    /**
     * Same as getCurrentUser() but returns null for anonymous / unauthenticated requests.
     */
    public User getCurrentUserOrNull() {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth == null || !auth.isAuthenticated() ||
                    "anonymousUser".equals(auth.getPrincipal())) {
                return null;
            }
            return getCurrentUser();
        } catch (Exception e) {
            return null;
        }
    }
}
