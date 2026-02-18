package com.plantsocial.backend.service;

import com.plantsocial.backend.dto.plantnet.PlantNetResponse;
import com.plantsocial.backend.dto.plantnet.PlantNetResult;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.IOException;
import java.util.Collections;
import java.util.List;

@Service
@Slf4j
@RequiredArgsConstructor
public class PlantNetService {

    @Value("${plantnet.api.key}")
    private String apiKey;

    @Value("${plantnet.api.url}")
    private String apiUrl;

    private final RestTemplate restTemplate;

    public PlantNetService() {
        org.springframework.http.client.SimpleClientHttpRequestFactory factory = new org.springframework.http.client.SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(10000); // 10 seconds
        factory.setReadTimeout(10000); // 10 seconds
        this.restTemplate = new RestTemplate(factory);
    }

    public PlantNetResponse identify(MultipartFile file) {
        if (apiKey == null || apiKey.isEmpty() || apiKey.contains("PLANTNET_API_KEY")) {
            log.warn("PlantNet API key is invalid or missing.");
            return new PlantNetResponse();
        }

        try {
            // Build URL
            String url = UriComponentsBuilder.fromHttpUrl(apiUrl)
                    .queryParam("api-key", apiKey)
                    .toUriString();

            // Build Headers
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.MULTIPART_FORM_DATA);

            // Build Body
            MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();

            // Convert MultipartFile to Resource
            ByteArrayResource resource = new ByteArrayResource(file.getBytes()) {
                @Override
                public String getFilename() {
                    return file.getOriginalFilename();
                }
            };

            body.add("images", resource);
            body.add("organs", "auto"); // default organ

            HttpEntity<MultiValueMap<String, Object>> requestEntity = new HttpEntity<>(body, headers);

            // Execute Request
            log.info("Sending request to PlantNet API: {}", url);
            ResponseEntity<PlantNetResponse> response = restTemplate.postForEntity(url, requestEntity,
                    PlantNetResponse.class);

            log.info("PlantNet API Response: {}", response.getStatusCode());
            return response.getBody();

        } catch (IOException e) {
            log.error("Error reading file bytes for PlantNet upload", e);
            throw new RuntimeException("Failed to process image for identification", e);
        } catch (Exception e) {
            log.error("Error calling PlantNet API", e);
            // Return empty response on failure to not block user flow entirely, or throw?
            // For now, return empty to fail gracefully.
            return new PlantNetResponse();
        }
    }
}
