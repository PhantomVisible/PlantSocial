package com.plantsocial.gamification.client;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;

@Slf4j
@Service
public class NotificationClient {

    private final RestTemplate restTemplate;
    private final String backendUrl;

    public NotificationClient(RestTemplate restTemplate,
            @Value("${app.backend.url:http://localhost:8080}") String backendUrl) {
        this.restTemplate = restTemplate;
        this.backendUrl = backendUrl;
    }

    public void sendSystemNotification(String userId, String content) {
        try {
            String url = backendUrl + "/api/v1/notifications/system";
            log.info("Dispatching internal system notification to {}", url);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            Map<String, Object> payload = new HashMap<>();
            payload.put("userId", userId);
            payload.put("content", content);

            HttpEntity<Map<String, Object>> request = new HttpEntity<>(payload, headers);

            restTemplate.postForObject(url, request, String.class);
            log.info("Successfully pushed notification for user {}", userId);
        } catch (Exception e) {
            log.error("Failed to send system notification: {}", e.getMessage());
        }
    }
}
