package com.plantsocial.backend.realtime;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/realtime")
public class RealtimeController {

    private final CentrifugoTokenService centrifugoTokenService;

    public RealtimeController(CentrifugoTokenService centrifugoTokenService) {
        this.centrifugoTokenService = centrifugoTokenService;
    }

    /**
     * Returns a short-lived Centrifugo connection token for the authenticated user.
     * Protected by default via SecurityConfig (.anyRequest().authenticated()) — no permitAll needed.
     */
    @GetMapping("/token")
    public CentrifugoTokenResponse getConnectionToken(@AuthenticationPrincipal Jwt jwt) {
        String token = centrifugoTokenService.generateConnectionToken(jwt.getSubject());
        return new CentrifugoTokenResponse(token);
    }

    public record CentrifugoTokenResponse(String token) {}
}
