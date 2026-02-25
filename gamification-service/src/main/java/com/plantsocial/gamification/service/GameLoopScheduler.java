package com.plantsocial.gamification.service;

import com.plantsocial.gamification.model.VirtualPlant;
import com.plantsocial.gamification.repository.VirtualPlantRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class GameLoopScheduler {

    private final VirtualPlantRepository plantRepository;

    @Scheduled(cron = "0 0 * * * *") // Runs at the top of every hour
    @Transactional
    public void runHourlyDecay() {
        log.info("Executing hourly decay loop for all virtual plants...");
        List<VirtualPlant> plants = plantRepository.findAll();

        for (VirtualPlant plant : plants) {
            // Decay hydration and cleanliness
            plant.setHydration(Math.max(0, plant.getHydration() - 2));
            plant.setCleanliness(Math.max(0, plant.getCleanliness() - 1));

            // Check if health drops below 30%
            if (plant.getHydration() < 30 || plant.getCleanliness() < 30) {
                triggerPhantomVisibleWarning(plant);
            }
        }

        plantRepository.saveAll(plants);
        log.info("Hourly decay loop completed. Processed {} plants.", plants.size());
    }

    private void triggerPhantomVisibleWarning(VirtualPlant plant) {
        // AI Persona Hook: Phantom Visible
        // "1000 Light novels about heroic main character energy" voice
        String warning = String.format(
                "⚠️ [PHANTOM VISIBLE SYSTEM ALERT] ⚠️\n" +
                        "Heed my words, guardian of %s! The life force of your verdant companion is fading into the abyss!\n"
                        +
                        "Hydration is at %d%% and Cleanliness rests at %d%%.\n" +
                        "If you do not act with the swiftness of a falling star, this manifestation of nature shall perish from our realm!\n"
                        +
                        "Awaken your power, summon the waters of revival, and cleanse this corruption before it is too late!",
                plant.getName(), plant.getHydration(), plant.getCleanliness());

        log.warn(warning);
        // TODO: Future integration with Notification queue/service to push this to the
        // user's client.
    }
}
