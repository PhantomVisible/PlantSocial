package com.plantsocial.chat.service;

import com.plantsocial.chat.model.ChatMessage;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.Map;

/**
 * Publishes chat messages to the Centrifugo real-time server via its HTTP API.
 * This replaces the Redis Pub/Sub + STOMP broadcast pipeline.
 */
@Service
public class CentrifugoPublisherService {

    private final RestClient restClient;
    private final String apiKey;

    public CentrifugoPublisherService(
            @Value("${centrifugo.api-url}") String apiUrl,
            @Value("${centrifugo.api-key}") String apiKey) {
        this.apiKey  = apiKey;
        this.restClient = RestClient.builder()
                .baseUrl(apiUrl)
                .defaultHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                .build();
    }

    /**
     * Publishes a ChatMessage to the given Centrifugo channel.
     *
     * @param channel    The Centrifugo channel name (e.g. "plantsocial-chat")
     * @param message    The ChatMessage payload to broadcast
     */
    public void publish(String channel, ChatMessage message) {
        Map<String, Object> body = Map.of(
                "channel", channel,
                "data", Map.of(
                        "sender",    message.getSender(),
                        "content",   message.getContent(),
                        "type",      message.getType() != null ? message.getType().name() : "CHAT",
                        "timestamp", message.getTimestamp() != null ? message.getTimestamp().toString() : ""
                )
        );

        restClient.post()
                .uri("/publish")
                .header("Authorization", "apikey " + apiKey)
                .body(body)
                .retrieve()
                .toBodilessEntity();
    }
}
