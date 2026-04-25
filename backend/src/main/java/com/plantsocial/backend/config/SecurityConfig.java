package com.plantsocial.backend.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;

import com.plantsocial.backend.user.UserRepository;
import com.plantsocial.backend.security.JwtUserSyncFilter;
import org.springframework.security.oauth2.server.resource.web.authentication.BearerTokenAuthenticationFilter;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

        private final UserRepository userRepository;

        public SecurityConfig(UserRepository userRepository) {
                this.userRepository = userRepository;
        }

        @Bean
        public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
                http
                        .csrf(AbstractHttpConfigurer::disable)
                        .cors(AbstractHttpConfigurer::disable) // CORS is handled exclusively by the API Gateway
                        .authorizeHttpRequests(auth -> auth

                                // ── Fully public (no token required) ──────────────────────────────
                                // Static assets
                                .requestMatchers("/ws/**").permitAll()

                                // Public read-only feeds (the "Reddit model")
                                .requestMatchers(HttpMethod.GET,
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

                                // Internal system notifications (posted by other services)
                                .requestMatchers(HttpMethod.POST, "/api/v1/notifications/system").permitAll()

                                // ── Everything else requires a valid Keycloak JWT ─────────────────
                                .anyRequest().authenticated()
                        )
                        .sessionManagement(session -> session
                                .sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                        .oauth2ResourceServer(oauth2 -> oauth2.jwt(Customizer.withDefaults()))
                        
                        // Register our JIT Provisioning filter AFTER Keycloak auth validates the token
                        .addFilterAfter(new JwtUserSyncFilter(userRepository), BearerTokenAuthenticationFilter.class);

                return http.build();
        }

        // CORS removed — handled exclusively by the API Gateway via globalcors config.
        // Having CORS here AND in the Gateway causes duplicate Access-Control-Allow-Origin headers.

        @Bean
        public PasswordEncoder passwordEncoder() {
                return new BCryptPasswordEncoder();
        }
}
