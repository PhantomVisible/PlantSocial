package com.plantsocial.backend.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.plantsocial.backend.dto.DiagnosisDTO;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import java.util.*;

@Service
@Slf4j
@RequiredArgsConstructor
public class PlantDoctorService {

    @Value("${gemini.api.key}")
    private String apiKey;

    @Value("${gemini.api.url}")
    private String apiUrl;

    private final ObjectMapper objectMapper;
    private final RestTemplate restTemplate = new RestTemplate();

    public DiagnosisDTO diagnose(MultipartFile file) {
        try {
            String base64Image = Base64.getEncoder().encodeToString(file.getBytes());
            String responseBody = callGeminiApi(base64Image);
            return parseGeminiResponse(responseBody);
        } catch (Exception e) {
            log.error("Error diagnosing plant", e);
            throw new RuntimeException("Failed to diagnose plant: " + e.getMessage());
        }
    }

    private String callGeminiApi(String base64Image) {
        String url = apiUrl + "?key=" + apiKey;

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        // Construct Gemini JSON Payload
        Map<String, Object> payload = new HashMap<>();

        // Contents
        Map<String, Object> partText = new HashMap<>();
        partText.put("text",
                "You are an expert botanist. Analyze this image. If likely healthy, set status to 'Healthy'. If sick, set status to 'Sick'. ALWAYS provide a confidence score (0-100) for your diagnosis. If sick, provide disease name and 3 treatment steps. Return clean JSON: { \"status\": \"Healthy\" | \"Sick\", \"diseaseName\": \"...\", \"confidence\": 95, \"treatmentSteps\": [...] }.");

        Map<String, Object> partImage = new HashMap<>();
        Map<String, Object> inlineData = new HashMap<>();
        inlineData.put("mime_type", "image/jpeg"); // Assuming JPEG or PNG, Gemini is flexible but mime_type is required
        inlineData.put("data", base64Image);
        partImage.put("inline_data", inlineData);

        Map<String, Object> content = new HashMap<>();
        content.put("parts", Arrays.asList(partText, partImage));

        payload.put("contents", Collections.singletonList(content));

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(payload, headers);

        ResponseEntity<String> response = restTemplate.postForEntity(url, request, String.class);
        return response.getBody();
    }

    private DiagnosisDTO parseGeminiResponse(String responseBody) {
        try {
            // Gemini response structure: candidates[0].content.parts[0].text
            var jsonNode = objectMapper.readTree(responseBody);
            String rawText = jsonNode.path("candidates").get(0)
                    .path("content").path("parts").get(0)
                    .path("text").asText();

            // Clean formatting if Gemini adds markdown
            rawText = rawText.replace("```json", "").replace("```", "").trim();

            return objectMapper.readValue(rawText, DiagnosisDTO.class);
        } catch (Exception e) {
            log.error("Failed to parse Gemini response: {}", responseBody, e);
            throw new RuntimeException("AI Response parsing failed");
        }
    }
}
