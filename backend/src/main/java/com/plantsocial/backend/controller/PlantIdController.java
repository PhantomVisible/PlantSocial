package com.plantsocial.backend.controller;

import com.plantsocial.backend.dto.plantnet.PlantNetResponse;
import com.plantsocial.backend.dto.plantnet.PlantNetResult;
import com.plantsocial.backend.service.PlantNetService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/v1/plant-id")
@RequiredArgsConstructor
public class PlantIdController {

    private final PlantNetService plantNetService;

    @PostMapping(value = "/verify", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<List<PlantNetResult>> verifyPlant(@RequestParam("file") MultipartFile file) {
        PlantNetResponse response = plantNetService.identify(file);

        if (response != null && response.getResults() != null) {
            if (!response.getResults().isEmpty()) {
                PlantNetResult top = response.getResults().get(0);
                log.debug("PlantNet Top Result: {} Score: {}", top.getSpecies().getScientificNameWithoutAuthor(),
                        top.getScore());
            } else {
                log.debug("PlantNet returned 0 results");
            }

            // Return top 3 results
            List<PlantNetResult> topResults = response.getResults().stream()
                    .limit(3)
                    .toList();
            return ResponseEntity.ok(topResults);
        }

        log.debug("PlantNet response was null or empty");
        return ResponseEntity.ok(List.of());
    }
}
