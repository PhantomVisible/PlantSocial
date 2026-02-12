package com.plantsocial.backend.controller;

import com.plantsocial.backend.dto.PlantResponse;
import com.plantsocial.backend.service.PlantService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/plants")
@RequiredArgsConstructor
public class PlantController {

    private final PlantService plantService;

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<PlantResponse> addPlant(
            @RequestParam("nickname") String nickname,
            @RequestParam(value = "species", required = false) String species,
            @RequestParam(value = "image", required = false) MultipartFile image) {
        return ResponseEntity.ok(plantService.addPlant(nickname, species, image));
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<PlantResponse>> getUserPlants(@PathVariable UUID userId) {
        return ResponseEntity.ok(plantService.getUserPlants(userId));
    }

    @GetMapping("/{plantId}")
    public ResponseEntity<PlantResponse> getPlant(@PathVariable UUID plantId) {
        return ResponseEntity.ok(plantService.getPlant(plantId));
    }
}
