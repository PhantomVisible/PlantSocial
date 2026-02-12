package com.plantsocial.backend.service;

import com.plantsocial.backend.dto.PlantResponse;
import com.plantsocial.backend.model.Plant;
import com.plantsocial.backend.model.PlantStatus;
import com.plantsocial.backend.repository.PlantRepository;
import com.plantsocial.backend.user.User;
import com.plantsocial.backend.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PlantService {

    private final PlantRepository plantRepository;
    private final UserRepository userRepository;
    private final FileStorageService fileStorageService;

    @Transactional
    public PlantResponse addPlant(String nickname, String species, MultipartFile image) {
        User user = getCurrentUser();

        String imageUrl = null;
        if (image != null && !image.isEmpty()) {
            imageUrl = fileStorageService.storeFile(image);
        }

        Plant plant = Plant.builder()
                .owner(user)
                .nickname(nickname)
                .species(species)
                .imageUrl(imageUrl)
                .status(PlantStatus.ALIVE)
                .build();
        Plant saved = plantRepository.save(plant);
        return mapToResponse(saved);
    }

    public List<PlantResponse> getUserPlants(UUID userId) {
        return plantRepository.findByOwnerIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public PlantResponse getPlant(UUID plantId) {
        Plant plant = plantRepository.findById(plantId)
                .orElseThrow(() -> new IllegalArgumentException("Plant not found"));
        return mapToResponse(plant);
    }

    private PlantResponse mapToResponse(Plant plant) {
        return new PlantResponse(
                plant.getId(),
                plant.getNickname(),
                plant.getSpecies(),
                plant.getImageUrl(),
                plant.getStatus().name(),
                plant.getOwner().getId(),
                plant.getOwner().getFullName(),
                plant.getCreatedAt());
    }

    private User getCurrentUser() {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        String email;
        if (principal instanceof UserDetails) {
            email = ((UserDetails) principal).getUsername();
        } else {
            email = principal.toString();
        }
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));
    }
}
