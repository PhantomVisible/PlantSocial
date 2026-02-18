package com.plantsocial.backend.chat;

import com.plantsocial.backend.chat.dto.SendMessageRequest;
import com.plantsocial.backend.user.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
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

        User sender = extractUser(principal);
        if (sender == null) {
            log.warn("Unauthenticated message attempt");
            return;
        }

        chatService.sendMessage(
                UUID.fromString(roomId),
                sender,
                request.content(),
                request.messageType(),
                null // media handled via REST upload
        );

        // Note: ChatService.sendMessage() already broadcasts to /topic/room/{roomId}
        // Do NOT broadcast again here — that causes duplicate messages.
        log.debug("Message sent to room {} by {}", roomId, sender.getUsername());
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
        if (principal instanceof UsernamePasswordAuthenticationToken auth) {
            Object p = auth.getPrincipal();
            if (p instanceof User user) {
                return user;
            }
        }
        return null;
    }
}
