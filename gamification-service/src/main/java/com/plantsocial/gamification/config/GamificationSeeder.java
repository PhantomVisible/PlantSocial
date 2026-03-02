package com.plantsocial.gamification.config;

import com.plantsocial.gamification.model.VirtualPlant;
import com.plantsocial.gamification.repository.VirtualPlantRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Slf4j
@Component
@RequiredArgsConstructor
public class GamificationSeeder implements CommandLineRunner {

    private final VirtualPlantRepository plantRepository;

    // Hardcoded UUIDs synced with BackendSeeder.java
    public static final String BACHIR_ID = "c0a801fa-0000-0000-0000-000000000001";
    public static final String ALAE_ID = "c0a801fa-0000-0000-0000-000000000002";
    public static final String PHANTOM_ID = "c0a801fa-0000-0000-0000-000000000003";
    public static final String ALICE_ID = "c0a801fa-0000-0000-0000-000000000004";
    public static final String BOB_ID = "c0a801fa-0000-0000-0000-000000000005";

    @Override
    @Transactional
    public void run(String... args) throws Exception {
        if (plantRepository.count() > 0) {
            log.info("Gamification database already populated. Skipping Gamification Seeder.");
            return;
        }

        log.info("Gamification database is empty. Initiating Gamification Seeder for Demo Day...");

        List<VirtualPlant> plants = new ArrayList<>();

        // PhantomAdmin's collection
        plants.add(createPlant(PHANTOM_ID, "Vessel Alpha", "Monstera", 100, 100, "ANCIENT"));
        plants.add(createPlant(PHANTOM_ID, "Vessel Beta", "Pothos", 90, 80, "BLOOM"));
        plants.add(createPlant(PHANTOM_ID, "Abyssal Root", "Snake Plant", 40, 30, "SAPLING"));

        // Bachir's collection
        plants.add(createPlant(BACHIR_ID, "Code Buddy", "English Ivy", 45, 60, "SPROUT"));
        plants.add(createPlant(BACHIR_ID, "Debug Tool", "Monstera", 12, 10, "SEED")); // Needs attention UI

        // Alae's collection
        plants.add(createPlant(ALAE_ID, "Founders Plant", "Pothos", 80, 90, "BLOOM"));
        plants.add(createPlant(ALAE_ID, "Marketing Tree", "Bonsai", 75, 40, "SAPLING"));
        plants.add(createPlant(ALAE_ID, "Creative Spark", "Sunflower", 100, 100, "SEED"));

        // Alice's collection
        plants.add(createPlant(ALICE_ID, "Barnaby", "Monstera", 95, 95, "ANCIENT"));
        plants.add(createPlant(ALICE_ID, "Lily", "English Ivy", 50, 50, "SPROUT"));

        // Bob's collection
        plants.add(createPlant(BOB_ID, "Survivor", "Snake Plant", 5, 20, "ANCIENT")); // Almost dead UI
        plants.add(createPlant(BOB_ID, "Cactus Jack", "Cactus", 100, 80, "SEED"));

        plantRepository.saveAll(plants);

        // Let the lifecycle methods handle dates or override manually here if you wish
        for (VirtualPlant p : plants) {
            p.setCreatedAt(LocalDateTime.now().minusDays((long) (Math.random() * 30)));
            p.setLastCleaned(LocalDateTime.now().minusHours((long) (Math.random() * 48)));
            p.setLastWatered(LocalDateTime.now().minusHours((long) (Math.random() * 48)));
        }
        plantRepository.saveAll(plants);

        log.info("Successfully seeded 12 Virtual Plants.");
    }

    private VirtualPlant createPlant(String userId, String name, String species, int hydration, int cleanliness,
            String stage) {
        VirtualPlant plant = new VirtualPlant();
        plant.setUserId(userId);
        plant.setName(name);
        plant.setSpecies(species);
        plant.setHydration(hydration);
        plant.setCleanliness(cleanliness);
        plant.setStage(stage);
        plant.setCreatedAt(LocalDateTime.now().minusDays(30));
        plant.setUpdatedAt(LocalDateTime.now());
        plant.setLastWatered(LocalDateTime.now().minusHours(24));
        plant.setLastCleaned(LocalDateTime.now().minusHours(24));
        return plant;
    }
}
