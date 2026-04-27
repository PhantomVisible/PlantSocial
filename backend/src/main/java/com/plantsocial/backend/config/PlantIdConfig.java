package com.plantsocial.backend.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.plant-id")
public record PlantIdConfig(String apiKey, String baseUrl) {}
