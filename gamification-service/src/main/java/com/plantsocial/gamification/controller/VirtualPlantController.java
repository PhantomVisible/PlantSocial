package com.plantsocial.gamification.controller;

import com.plantsocial.gamification.dto.VirtualPlantResponse;
import com.plantsocial.gamification.model.VirtualPlant;
import com.plantsocial.gamification.service.VirtualPlantService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/game/plant")
@RequiredArgsConstructor
public class VirtualPlantController {

    private final VirtualPlantService plantService;

    @GetMapping("/{userId}")
    public ResponseEntity<List<VirtualPlant>> getPlantStatus(@PathVariable Long userId) {
        return ResponseEntity.ok(plantService.getPlantsByUserId(userId));
    }

    @GetMapping("/leaderboard")
    public ResponseEntity<List<VirtualPlant>> getLeaderboard() {
        return ResponseEntity.ok(plantService.getLeaderboard());
    }

    @PostMapping("/{userId}")
    public ResponseEntity<VirtualPlantResponse> plantSeed(@PathVariable Long userId, @RequestParam String species) {
        try {
            return ResponseEntity.ok(plantService.plantSeed(userId, species));
        } catch (IllegalStateException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PostMapping("/{plantId}/water")
    public ResponseEntity<VirtualPlantResponse> waterPlant(@PathVariable Long plantId) {
        return plantService.waterPlant(plantId)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PostMapping("/{plantId}/clean")
    public ResponseEntity<VirtualPlantResponse> cleanPlant(@PathVariable Long plantId) {
        return plantService.cleanPlant(plantId)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{plantId}")
    public ResponseEntity<Void> deletePlant(@PathVariable Long plantId) {
        if (plantService.deletePlant(plantId)) {
            return ResponseEntity.ok().build();
        }
        return ResponseEntity.notFound().build();
    }
}
