package com.plantsocial.gamification.service;

import com.plantsocial.gamification.client.NotificationClient;
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
    private final NotificationClient notificationClient;

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
                log.warn(
                        "⚠️ [XYLA SYSTEM ALERT] ⚠️\nGuardian! Your plant's life force fades! Hydration: {}%, Cleanliness: {}%. Act now!",
                        plant.getHydration(), plant.getCleanliness());

                String message = "⚠️ Guardian! Your plant's life force fades! " +
                        "Hydration: " + plant.getHydration() + "%, Cleanliness: " + plant.getCleanliness() + "%. " +
                        "Cleanse and water it now before it perishes!";

                if (plant.getUserId() != null) {
                    notificationClient.sendSystemNotification(plant.getUserId().toString(), message);
                }
            }
        }

        plantRepository.saveAll(plants);
        log.info("Hourly decay loop completed. Processed {} plants.", plants.size());
    }
}
