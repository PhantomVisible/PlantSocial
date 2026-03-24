package com.plantsocial.chat.controller;

import com.plantsocial.chat.config.RedisConfig;
import com.plantsocial.chat.model.ChatMessage;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Controller;

import java.time.Instant;

@Controller
public class ChatController {

    private final RedisTemplate<String, Object> redisTemplate;

    public ChatController(RedisTemplate<String, Object> redisTemplate) {
        this.redisTemplate = redisTemplate;
    }

    @MessageMapping("/chat.send")
    public void sendMessage(@Payload ChatMessage chatMessage, Authentication authentication) {
        // Enforce sender from JWT token if authentication is present
        if (authentication != null && authentication.getName() != null) {
            chatMessage.setSender(authentication.getName());
        }
        if (chatMessage.getTimestamp() == null) {
            chatMessage.setTimestamp(Instant.now());
        }
        
        // Publish to Redis instead of processing locally
        redisTemplate.convertAndSend(RedisConfig.CHAT_TOPIC, chatMessage);
    }
}
