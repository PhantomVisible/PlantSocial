package com.plantsocial.apigateway;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.reactive.EnableWebFluxSecurity;
import org.springframework.security.config.web.server.ServerHttpSecurity;
import org.springframework.security.web.server.SecurityWebFilterChain;

@Configuration
@EnableWebFluxSecurity
public class SecurityConfig {

    @Bean
    public SecurityWebFilterChain springSecurityFilterChain(ServerHttpSecurity http) {
        http
                .csrf(ServerHttpSecurity.CsrfSpec::disable)
                .authorizeExchange(exchanges -> exchanges

                        // ── Fully public (no token required) ─────────────────────────────
                        // WebSocket connections to Centrifugo
                        .pathMatchers("/connection/**").permitAll()

                        // Public read-only GET endpoints (mirrors the "Reddit model" in the backend)
                        .pathMatchers(HttpMethod.GET,
                                "/api/v1/feed/**",
                                "/api/v1/news/**",
                                "/api/v1/trends/**",
                                "/api/v1/posts/**",
                                "/api/v1/comments/**",
                                "/api/v1/plants/**",
                                "/api/v1/shop/products/**",
                                "/api/v1/marketplace/listings/**",
                                "/api/v1/marketplace/listing/**"
                        ).permitAll()

                        // Internal inter-service notifications
                        .pathMatchers(HttpMethod.POST, "/api/v1/notifications/system").permitAll()

                        // ── Everything else requires a valid Keycloak JWT ─────────────────
                        .anyExchange().authenticated()
                )
                // Tell the Gateway to look for a Bearer Token in the HTTP headers
                .oauth2ResourceServer(oauth2 -> oauth2.jwt(Customizer.withDefaults()));

        return http.build();
    }
}