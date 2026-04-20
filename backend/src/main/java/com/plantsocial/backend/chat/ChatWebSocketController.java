package com.plantsocial.backend.chat;

import com.plantsocial.backend.chat.dto.SendMessageRequest;
import com.plantsocial.backend.user.User;
import com.plantsocial.backend.user.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Controller;

import java.security.Principal;
import java.util.Map;
import java.util.UUID;

/**
 * STOMP WebSocket controller for real-time messaging.
 */
@Slf4j
@Controller
@RequiredArgsConstructor
public class ChatWebSocketController {

    private final ChatService chatService;
    private final SimpMessagingTemplate messagingTemplate;
    private final UserRepository userRepository;

    /**
     * Receives a message from a client and broadcasts it to the room's topic.
     * Client sends to: /app/chat.send/{roomId}
     * Broadcast to: /topic/room/{roomId}
     */
    @MessageMapping("/chat.send/{roomId}")
    public void sendMessage(
            @DestinationVariable String roomId,
            @Payload SendMessageRequest request,
            Principal principal) {

        log.info("WS sendMessage invoked for room: {}", roomId);

        User sender = extractUser(principal);
        if (sender == null) {
            log.warn("Unauthenticated message attempt! Principal is: {}", principal);
            return;
        }

        log.info("WS sender authenticated: {}", sender.getUsername());

        try {
            chatService.sendMessage(
                    UUID.fromString(roomId),
                    sender,
                    request.content(),
                    request.messageType(),
                    null // media handled via REST upload
            );
            log.info("Message successfully dispatched via chatService for room: {}", roomId);
        } catch (Exception e) {
            log.error("Error inside chatService.sendMessage: ", e);
        }
    }

    /**
     * Typing indicator.
     * Client sends to: /app/chat.typing/{roomId}
     * Broadcast to: /topic/room/{roomId}/typing
     */
    @MessageMapping("/chat.typing/{roomId}")
    public void typing(
            @DestinationVariable String roomId,
            Principal principal) {

        User sender = extractUser(principal);
        if (sender == null)
            return;

        messagingTemplate.convertAndSend("/topic/room/" + roomId + "/typing",
                Map.of("userId", sender.getId().toString(),
                        "username", sender.getUsername(),
                        "fullName", sender.getFullName()));
    }

    private User extractUser(Principal principal) {
        if (principal instanceof JwtAuthenticationToken auth) {
            String username = (String) auth.getTokenAttributes().get("preferred_username");
            if (username != null) {
                return userRepository.findByUsername(username).orElse(null);
            }
        }
        return null;
    }
}
