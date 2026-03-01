package com.plantsocial.gamification.controller;

import com.plantsocial.gamification.dto.VirtualPlantResponse;
import com.plantsocial.gamification.model.VirtualPlant;
import com.plantsocial.gamification.repository.VirtualPlantRepository;
import com.plantsocial.gamification.service.GameLoopScheduler;
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
    private final VirtualPlantRepository plantRepository;
    private final GameLoopScheduler gameLoopScheduler;

    @GetMapping("/{userId}")
    public ResponseEntity<List<VirtualPlant>> getPlantStatus(@PathVariable String userId) {
        return ResponseEntity.ok(plantService.getPlantsByUserId(userId));
    }

    @GetMapping("/leaderboard")
    public ResponseEntity<List<VirtualPlant>> getLeaderboard() {
        return ResponseEntity.ok(plantService.getLeaderboard());
    }

    @PostMapping("/{userId}")
    public ResponseEntity<VirtualPlantResponse> plantSeed(@PathVariable String userId, @RequestParam String species) {
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

    // ===== TEMPORARY TEST ENDPOINT — Remove after testing =====
    @PostMapping("/test/dehydrate-all")
    public ResponseEntity<String> dehydrateAll() {
        List<VirtualPlant> plants = plantRepository.findAll();
        for (VirtualPlant plant : plants) {
            plant.setHydration(10);
            plant.setCleanliness(15);
        }
        plantRepository.saveAll(plants);
        // Immediately trigger the decay loop to fire notifications
        gameLoopScheduler.runHourlyDecay();
        return ResponseEntity.ok("Dehydrated " + plants.size() + " plants and triggered decay loop.");
    }
}
