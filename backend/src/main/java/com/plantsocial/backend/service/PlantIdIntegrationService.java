package com.plantsocial.backend.service;

import com.plantsocial.backend.config.PlantIdConfig;
import com.plantsocial.backend.dto.PlantIdentificationDTO;
import com.plantsocial.backend.dto.plantid.PlantIdApiResponse;
import com.plantsocial.backend.dto.plantid.PlantIdSuggestion;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Base64;
import java.util.Collections;
import java.util.List;
import java.util.Map;

@Service
@Slf4j
@RequiredArgsConstructor
public class PlantIdIntegrationService {

    private final PlantIdConfig plantIdConfig;
    private final RestTemplate restTemplate;

    public PlantIdentificationDTO identifyPlant(MultipartFile file) {
        try {
            byte[] bytes = file.getBytes();
            String contentType = file.getContentType() != null ? file.getContentType() : "image/jpeg";
            String base64Image = "data:" + contentType + ";base64," + Base64.getEncoder().encodeToString(bytes);

            HttpHeaders headers = new HttpHeaders();
            headers.set("Api-Key", plantIdConfig.apiKey());
            headers.setContentType(MediaType.APPLICATION_JSON);

            Map<String, Object> body = Map.of("images", List.of(base64Image));
            HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);

            String url = plantIdConfig.baseUrl() + "/identification";
            log.info("Calling Plant.id v3 at {}", url);

            ResponseEntity<PlantIdApiResponse> response = restTemplate.postForEntity(url, request, PlantIdApiResponse.class);

            PlantIdApiResponse apiResponse = response.getBody();
            if (apiResponse == null
                    || apiResponse.result() == null
                    || apiResponse.result().classification() == null) {
                log.warn("Plant.id returned a null or empty result");
                return empty();
            }

            List<PlantIdSuggestion> suggestions = apiResponse.result().classification().suggestions();
            if (suggestions == null || suggestions.isEmpty()) {
                log.warn("Plant.id returned no classification suggestions");
                return empty();
            }

            PlantIdSuggestion top = suggestions.get(0);
            log.info("Plant.id top match: {} ({}%)", top.name(),
                    String.format("%.1f", top.probability() * 100));

            return new PlantIdentificationDTO(top.name(), top.probability(), suggestions);

        } catch (IOException e) {
            log.error("Failed to read image bytes for Plant.id", e);
            return empty();
        } catch (Exception e) {
            log.error("Plant.id API call failed: {}", e.getMessage());
            return empty();
        }
    }

    private PlantIdentificationDTO empty() {
        return new PlantIdentificationDTO(null, 0.0, Collections.emptyList());
    }
}
