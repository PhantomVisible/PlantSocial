package com.plantsocial.backend.controller;

import com.plantsocial.backend.dto.PlantIdentificationDTO;
import com.plantsocial.backend.service.PlantIdIntegrationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@Slf4j
@RestController
@RequestMapping("/api/v1/plant-id")
@RequiredArgsConstructor
public class PlantIdController {

    private final PlantIdIntegrationService plantIdIntegrationService;

    @PostMapping(value = "/verify", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<PlantIdentificationDTO> verifyPlant(@RequestParam("file") MultipartFile file) {
        PlantIdentificationDTO result = plantIdIntegrationService.identifyPlant(file);
        log.debug("Plant.id verify result: topMatch={} confidence={}", result.topMatch(), result.confidence());
        return ResponseEntity.ok(result);
    }
}
