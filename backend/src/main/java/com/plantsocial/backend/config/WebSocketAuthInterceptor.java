package com.plantsocial.backend.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * Intercepts STOMP CONNECT frames to authenticate the user via a Keycloak-issued JWT.
 * The client must send the token as a STOMP header: Authorization: Bearer <token>
 * Uses JwtDecoder (RSA validation) provided by spring-boot-starter-oauth2-resource-server.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class WebSocketAuthInterceptor implements ChannelInterceptor {

    private final JwtDecoder jwtDecoder;

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor =
                MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);

        if (accessor != null && StompCommand.CONNECT.equals(accessor.getCommand())) {
            List<String> authHeaders = accessor.getNativeHeader("Authorization");
            if (authHeaders != null && !authHeaders.isEmpty()) {
                String authHeader = authHeaders.get(0);
                if (authHeader != null && authHeader.startsWith("Bearer ")) {
                    String token = authHeader.substring(7);
                    try {
                        Jwt jwt = jwtDecoder.decode(token);
                        JwtAuthenticationToken authentication = new JwtAuthenticationToken(jwt);
                        accessor.setUser(authentication);
                        log.debug("WebSocket authenticated user: {}", jwt.getSubject());
                    } catch (Exception e) {
                        log.warn("WebSocket JWT validation failed: {}", e.getMessage());
                        // Return message without user set; downstream security will reject it
                    }
                }
            }
        }

        return message;
    }
}
