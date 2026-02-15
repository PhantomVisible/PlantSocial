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
            @RequestParam(value = "status", required = false) String status,
            @RequestParam(value = "plantedDate", required = false) @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE) java.time.LocalDate plantedDate,
            @RequestParam(value = "image", required = false) MultipartFile image) {
        return ResponseEntity.ok(plantService.addPlant(nickname, species, status, plantedDate, image));
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<PlantResponse>> getUserPlants(@PathVariable UUID userId) {
        return ResponseEntity.ok(plantService.getUserPlants(userId));
    }

    @GetMapping("/{plantId}")
    public ResponseEntity<PlantResponse> getPlant(@PathVariable UUID plantId) {
        return ResponseEntity.ok(plantService.getPlant(plantId));
    }

    @PutMapping(value = "/{plantId}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @org.springframework.security.access.prepost.PreAuthorize("@plantSecurity.isOwner(authentication, #plantId)")
    public ResponseEntity<PlantResponse> updatePlant(
            @PathVariable UUID plantId,
            @RequestParam(value = "nickname", required = false) String nickname,
            @RequestParam(value = "species", required = false) String species,
            @RequestParam(value = "status", required = false) String status,
            @RequestParam(value = "plantedDate", required = false) @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE) java.time.LocalDate plantedDate,
            @RequestParam(value = "harvestDate", required = false) @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE) java.time.LocalDate harvestDate,
            @RequestParam(value = "image", required = false) MultipartFile image) {
        return ResponseEntity
                .ok(plantService.updatePlant(plantId, nickname, species, status, plantedDate, harvestDate, image));
    }

    @DeleteMapping("/{plantId}")
    @org.springframework.security.access.prepost.PreAuthorize("@plantSecurity.isOwner(authentication, #plantId)")
    public ResponseEntity<Void> deletePlant(@PathVariable UUID plantId) {
        plantService.deletePlant(plantId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping(value = "/{plantId}/logs", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @org.springframework.security.access.prepost.PreAuthorize("@plantSecurity.isOwner(authentication, #plantId)")
    public ResponseEntity<com.plantsocial.backend.dto.LogResponse> addLog(
            @PathVariable UUID plantId,
            @RequestParam(value = "notes", required = false) String notes,
            @RequestParam(value = "logDate", required = false) @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE) java.time.LocalDate logDate,
            @RequestParam(value = "image", required = false) MultipartFile image) {
        return ResponseEntity.ok(plantService.addLog(plantId, notes, logDate, image));
    }

    @GetMapping("/{plantId}/logs")
    public ResponseEntity<List<com.plantsocial.backend.dto.LogResponse>> getPlantLogs(@PathVariable UUID plantId) {
        return ResponseEntity.ok(plantService.getPlantLogs(plantId));
    }

    @PutMapping(value = "/{plantId}/photo", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<PlantResponse> updatePlantPhoto(
            @PathVariable UUID plantId,
            @RequestParam("image") MultipartFile image) {
        return ResponseEntity.ok(plantService.updatePlantPhoto(plantId, image));
    }

    @DeleteMapping("/logs/{logId}")
    public ResponseEntity<Void> deleteLog(@PathVariable UUID logId) {
        plantService.deleteLog(logId);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/logs/{logId}")
    public ResponseEntity<com.plantsocial.backend.dto.LogResponse> updateLog(
            @PathVariable UUID logId,
            @RequestBody String notes) {
        // Note: RequestBody String might need quotes if passing raw string, or simple
        // text.
        // Better to use a DTO or @RequestParam for simplicity if just one field?
        // Let's use @RequestBody with a wrapper or just simple string.
        // For simplicity, let's use @RequestParam or a wrapper DTO.
        // But the requirement said "Input: String notes".
        // Let's try @RequestBody String notes.
        // Actually, Angular POST/PUT usually sends JSON.
        // I'll accept a Map or DTO, or simple String if content-type is text.
        // I'll stick to @RequestBody java.util.Map<String, String> payload for JSON
        // safety.
        return ResponseEntity.ok(plantService.updateLog(logId, notes)); // This expects string
    }

    // Changing updateLog signature to be safer with JSON
    @PutMapping(value = "/logs/{logId}", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<com.plantsocial.backend.dto.LogResponse> updateLogJson(
            @PathVariable UUID logId,
            @RequestBody java.util.Map<String, String> payload) {
        return ResponseEntity.ok(plantService.updateLog(logId, payload.get("notes")));
    }
}
