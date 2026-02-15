package com.plantsocial.backend.security;

import com.plantsocial.backend.model.Plant;
import com.plantsocial.backend.repository.PlantRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Component("plantSecurity")
@RequiredArgsConstructor
public class PlantSecurity {

    private final PlantRepository plantRepository;

    public boolean isOwner(Authentication authentication, UUID plantId) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return false;
        }

        Plant plant = plantRepository.findById(plantId).orElse(null);
        if (plant == null) {
            return false;
        }

        String currentUsername;
        Object principal = authentication.getPrincipal();

        if (principal instanceof UserDetails) {
            currentUsername = ((UserDetails) principal).getUsername();
        } else {
            currentUsername = principal.toString();
        }

        return plant.getOwner().getEmail().equals(currentUsername);
    }
}
