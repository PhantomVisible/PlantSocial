package com.plantsocial.apigateway;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
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
                // Disable CSRF because our Angular frontend will use JWT tokens, not session
                // cookies
                .csrf(ServerHttpSecurity.CsrfSpec::disable)

                // Require authentication for EVERY request that hits the Gateway
                .authorizeExchange(exchanges -> exchanges
                        .anyExchange().authenticated())

                // Tell the Gateway to look for a Bearer Token in the HTTP headers
                .oauth2ResourceServer(oauth2 -> oauth2.jwt(Customizer.withDefaults()));

        return http.build();
    }
}