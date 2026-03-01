package com.plantsocial.gamification.service;

import com.plantsocial.gamification.client.NotificationClient;
import com.plantsocial.gamification.dto.VirtualPlantResponse;
import com.plantsocial.gamification.model.VirtualPlant;
import com.plantsocial.gamification.repository.VirtualPlantRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class VirtualPlantService {

    private final VirtualPlantRepository plantRepository;
    private final NotificationClient notificationClient;

    public List<VirtualPlant> getPlantsByUserId(String userId) {
        return plantRepository.findByUserId(userId);
    }

    public List<VirtualPlant> getLeaderboard() {
        return plantRepository.findTop10ByOrderByCreatedAtAsc();
    }

    @Transactional
    public VirtualPlantResponse plantSeed(String userId, String species) {
        List<VirtualPlant> userPlants = plantRepository.findByUserId(userId);
        if (userPlants.size() >= 4) {
            throw new IllegalStateException("User already has maximum number of active plants (4).");
        }

        VirtualPlant plant = new VirtualPlant();
        plant.setUserId(userId);
        plant.setName("Plant"); // Default name, or could be passed
        plant.setSpecies(species);
        plant.setHydration(80);
        plant.setCleanliness(80);
        plant.setStage("SEED");

        VirtualPlant savedPlant = plantRepository.save(plant);
        return new VirtualPlantResponse(savedPlant, "The greenhouse slumbers! The vessel is planted.");
    }

    @Transactional
    public Optional<VirtualPlantResponse> waterPlant(Long plantId) {
        return plantRepository.findById(plantId).map(plant -> {
            plant.setHydration(Math.min(100, plant.getHydration() + 20));
            plant.setLastWatered(LocalDateTime.now());

            // Basic evolution logic over time could go here, but omitted for simplicity

            VirtualPlant savedPlant = plantRepository.save(plant);
            return new VirtualPlantResponse(savedPlant, "The vessel absorbs the life-essence! Its aura stabilizes!");
        });
    }

    @Transactional
    public Optional<VirtualPlantResponse> cleanPlant(Long plantId) {
        return plantRepository.findById(plantId).map(plant -> {
            plant.setCleanliness(Math.min(100, plant.getCleanliness() + 20));
            plant.setLastCleaned(LocalDateTime.now());

            VirtualPlant savedPlant = plantRepository.save(plant);
            return new VirtualPlantResponse(savedPlant, "The corruption is purged! The champion shines once more!");
        });
    }

    @Transactional
    public boolean deletePlant(Long plantId) {
        if (plantRepository.existsById(plantId)) {
            plantRepository.deleteById(plantId);
            return true;
        }
        return false;
    }

}
