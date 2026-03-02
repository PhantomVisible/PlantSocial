package com.plantsocial.gamification.service;

import com.plantsocial.gamification.client.NotificationClient;
import com.plantsocial.gamification.model.VirtualPlant;
import com.plantsocial.gamification.repository.VirtualPlantRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class PlantServiceTest {

    // The user requested to inject "PlantService" but indicated game logic.
    // In this service, GameLoopScheduler represents the hourly core game logic.
    @InjectMocks
    private GameLoopScheduler plantService;

    @Mock
    private VirtualPlantRepository plantRepository;

    @Mock
    private NotificationClient notificationClient;

    @Test
    void shouldCalculateCorrectDaysAlive() {
        // Test Case 1: "Days Alive" Calculation
        VirtualPlant plant = new VirtualPlant();
        plant.setCreatedAt(LocalDateTime.now().minusDays(5));

        plant.calculateDaysAlive();

        assertEquals(5, plant.getDaysAlive());
    }

    @Test
    void shouldApplyDehydrationPenalty() {
        // Test Case 2: Dehydration Logic
        VirtualPlant plant = new VirtualPlant();
        plant.setLastWatered(LocalDateTime.now().minusHours(24));
        plant.setHydration(80);

        when(plantRepository.findAll()).thenReturn(List.of(plant));

        // Act
        plantService.runHourlyDecay();

        // Assert
        assertEquals(78, plant.getHydration());
    }

    @Test
    void shouldMarkPlantAsDeadWhenHydrationIsZero() {
        // Test Case 3: Critical Status (Death)
        VirtualPlant plant = new VirtualPlant();
        plant.setHydration(2); // Hydration drops by 2 each decay loop
        plant.setCleanliness(50);

        when(plantRepository.findAll()).thenReturn(List.of(plant));

        // Act
        plantService.runHourlyDecay();

        // Assert
        assertEquals(0, plant.getHydration());
        assertTrue(plant.isDead());
    }
}
