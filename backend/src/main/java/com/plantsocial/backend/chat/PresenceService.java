package com.plantsocial.backend.chat;

import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Service;
import org.springframework.web.socket.messaging.SessionConnectedEvent;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

import com.plantsocial.backend.user.User;
import com.plantsocial.backend.user.UserRepository;

import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Tracks online presence of connected WebSocket users.
 */
@Slf4j
@Service
public class PresenceService {

    private final SimpMessagingTemplate messagingTemplate;
    private final UserRepository userRepository;

    // userId → session info
    private final Map<String, OnlineUser> onlineUsers = new ConcurrentHashMap<>();

    public PresenceService(SimpMessagingTemplate messagingTemplate, UserRepository userRepository) {
        this.messagingTemplate = messagingTemplate;
        this.userRepository = userRepository;
    }

    @EventListener
    public void handleWebSocketConnect(SessionConnectedEvent event) {
        StompHeaderAccessor accessor = StompHeaderAccessor.wrap(event.getMessage());
        if (accessor.getUser() instanceof JwtAuthenticationToken auth) {
            String username = (String) auth.getTokenAttributes().get("preferred_username");
            if (username != null) {
                userRepository.findByUsername(username).ifPresent(user -> {
                    String sessionId = accessor.getSessionId();
                    onlineUsers.put(user.getId().toString(), new OnlineUser(
                            user.getId().toString(),
                            user.getUsername(),
                            user.getFullName(),
                            sessionId,
                            LocalDateTime.now()));
                    log.info("User connected: {} (session: {})", user.getUsername(), sessionId);
                    broadcastPresence();
                });
            }
        }
    }

    @EventListener
    public void handleWebSocketDisconnect(SessionDisconnectEvent event) {
        StompHeaderAccessor accessor = StompHeaderAccessor.wrap(event.getMessage());
        if (accessor.getUser() instanceof JwtAuthenticationToken auth) {
            String username = (String) auth.getTokenAttributes().get("preferred_username");
            if (username != null) {
                userRepository.findByUsername(username).ifPresent(user -> {
                    onlineUsers.remove(user.getId().toString());
                    log.info("User disconnected: {}", user.getUsername());
                    broadcastPresence();
                });
            }
        }
    }

    public List<OnlineUser> getOnlineUsers() {
        return new ArrayList<>(onlineUsers.values());
    }

    public boolean isOnline(String userId) {
        return onlineUsers.containsKey(userId);
    }

    private void broadcastPresence() {
        messagingTemplate.convertAndSend("/topic/presence", getOnlineUsers());
    }

    public record OnlineUser(
            String userId,
            String username,
            String fullName,
            String sessionId,
            LocalDateTime connectedAt) {
    }
}
