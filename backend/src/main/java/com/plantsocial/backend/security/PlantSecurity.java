package com.plantsocial.backend.security;

import com.plantsocial.backend.model.Plant;
import com.plantsocial.backend.repository.PlantRepository;
import com.plantsocial.backend.user.User;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Component("plantSecurity")
@RequiredArgsConstructor
public class PlantSecurity {

    private final PlantRepository plantRepository;
    private final SecurityUtils securityUtils;

    public boolean isOwner(Authentication authentication, UUID plantId) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return false;
        }

        Plant plant = plantRepository.findById(plantId).orElse(null);
        if (plant == null) return false;

        User currentUser = securityUtils.getCurrentUserOrNull();
        if (currentUser == null) return false;

        return plant.getOwner().getId().equals(currentUser.getId());
    }
}
