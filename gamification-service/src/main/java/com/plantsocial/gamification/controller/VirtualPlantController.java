package com.plantsocial.gamification.controller;

import com.plantsocial.gamification.model.VirtualPlant;
import com.plantsocial.gamification.repository.VirtualPlantRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;

@RestController
@RequestMapping("/api/game/plant")
@RequiredArgsConstructor
public class VirtualPlantController {

    private final VirtualPlantRepository plantRepository;

    @GetMapping("/{userId}")
    public ResponseEntity<VirtualPlant> getPlantStatus(@PathVariable Long userId) {
        Optional<VirtualPlant> plantOpt = plantRepository.findByUserId(userId);
        return plantOpt.map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PostMapping("/{plantId}/water")
    public ResponseEntity<VirtualPlant> waterPlant(@PathVariable Long plantId) {
        return plantRepository.findById(plantId).map(plant -> {
            plant.setHydration(100);
            return ResponseEntity.ok(plantRepository.save(plant));
        }).orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PostMapping("/{plantId}/clean")
    public ResponseEntity<VirtualPlant> cleanPlant(@PathVariable Long plantId) {
        return plantRepository.findById(plantId).map(plant -> {
            plant.setCleanliness(100);
            return ResponseEntity.ok(plantRepository.save(plant));
        }).orElseGet(() -> ResponseEntity.notFound().build());
    }

    // Helper to create a plant for testing purposes
    @PostMapping("/create/{userId}")
    public ResponseEntity<VirtualPlant> createPlant(@PathVariable Long userId, @RequestParam String name) {
        if (plantRepository.findByUserId(userId).isPresent()) {
            return ResponseEntity.badRequest().build();
        }
        VirtualPlant plant = new VirtualPlant();
        plant.setUserId(userId);
        plant.setName(name);
        return ResponseEntity.ok(plantRepository.save(plant));
    }
}
