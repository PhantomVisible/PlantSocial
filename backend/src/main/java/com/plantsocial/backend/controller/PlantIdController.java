package com.plantsocial.backend.controller;

import com.plantsocial.backend.dto.plantnet.PlantNetResponse;
import com.plantsocial.backend.dto.plantnet.PlantNetResult;
import com.plantsocial.backend.service.PlantNetService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/v1/plant-id")
@RequiredArgsConstructor
public class PlantIdController {

    private final PlantNetService plantNetService;

    @PostMapping(value = "/verify", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<List<PlantNetResult>> verifyPlant(@RequestParam("file") MultipartFile file) {
        PlantNetResponse response = plantNetService.identify(file);

        if (response != null && response.getResults() != null) {
            // Log top result for debugging
            if (!response.getResults().isEmpty()) {
                PlantNetResult top = response.getResults().get(0);
                System.out.println("DEBUG: PlantNet Top Result: " + top.getSpecies().getScientificNameWithoutAuthor()
                        + " Score: " + top.getScore());
            } else {
                System.out.println("DEBUG: PlantNet returned 0 results");
            }

            // Return top 3 results
            List<PlantNetResult> topResults = response.getResults().stream()
                    .limit(3)
                    .toList();
            return ResponseEntity.ok(topResults);
        }

        System.out.println("DEBUG: PlantNet response was null or empty");
        return ResponseEntity.ok(List.of());
    }
}
