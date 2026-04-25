package com.plantsocial.backend.realtime;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.Map;

@Slf4j
@Service
public class CentrifugoPublisherService {

    private final RestClient restClient;
    private final String apiKey;

    public CentrifugoPublisherService(
            @Value("${centrifugo.api-url}") String apiUrl,
            @Value("${centrifugo.api-key}") String apiKey) {
        this.apiKey = apiKey;
        this.restClient = RestClient.builder()
                .baseUrl(apiUrl)
                .defaultHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                .build();
    }

    public void publish(String channel, Object data) {
        try {
            restClient.post()
                    .uri("/publish")
                    .header("Authorization", "apikey " + apiKey)
                    .body(Map.of("channel", channel, "data", data))
                    .retrieve()
                    .toBodilessEntity();
        } catch (Exception e) {
            log.warn("Centrifugo publish failed for channel {}: {}", channel, e.getMessage());
        }
    }
}
