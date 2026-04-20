package com.plantsocial.chat.controller;

import com.plantsocial.chat.model.ChatMessage;
import com.plantsocial.chat.service.CentrifugoPublisherService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.security.Principal;
import java.time.Instant;

/**
 * REST endpoint for sending chat messages.
 * Replaces the old @MessageMapping STOMP controller.
 * Validates the Keycloak JWT and delegates publishing to CentrifugoPublisherService.
 */
@RestController
@RequestMapping("/api/v1/chat")
@RequiredArgsConstructor
public class ChatController {

    private static final String CHANNEL = "plantsocial-chat";

    private final CentrifugoPublisherService centrifugoPublisher;

    @PostMapping("/send")
    public ResponseEntity<Void> sendMessage(
            @RequestBody ChatMessage chatMessage,
            Principal principal) {

        // Enforce sender identity from the Keycloak JWT — clients cannot spoof this
        if (principal instanceof JwtAuthenticationToken jwtAuth) {
            String username = (String) jwtAuth.getTokenAttributes().get("preferred_username");
            if (username != null) {
                chatMessage.setSender(username);
            }
        }

        if (chatMessage.getTimestamp() == null) {
            chatMessage.setTimestamp(Instant.now());
        }

        centrifugoPublisher.publish(CHANNEL, chatMessage);
        return ResponseEntity.ok().build();
    }
}
