package com.plantsocial.backend.service;

import com.plantsocial.backend.dto.PlantResponse;
import com.plantsocial.backend.model.Plant;
import com.plantsocial.backend.model.PlantStatus;
import com.plantsocial.backend.repository.PlantRepository;
import com.plantsocial.backend.user.User;
import com.plantsocial.backend.user.UserRepository;
import com.plantsocial.backend.model.PlantLog;
import com.plantsocial.backend.repository.PlantLogRepository;
import com.plantsocial.backend.dto.LogResponse;
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
    private final com.plantsocial.backend.repository.PostRepository postRepository;
    private final PlantLogRepository plantLogRepository;
    private final FileStorageService fileStorageService;

    @Transactional
    public PlantResponse addPlant(String nickname, String species, String status, java.time.LocalDate plantedDate,
            boolean isVerified, MultipartFile image) {
        User user = getCurrentUser();

        String imageUrl = null;
        if (image != null && !image.isEmpty()) {
            imageUrl = fileStorageService.storeFile(image);
        }

        PlantStatus plantStatus = PlantStatus.VEGETATIVE;
        if (status != null && !status.isBlank()) {
            try {
                plantStatus = PlantStatus.valueOf(status.toUpperCase());
            } catch (IllegalArgumentException e) {
                // Keep default
            }
        }

        java.time.LocalDate pDate = (plantedDate != null) ? plantedDate : java.time.LocalDate.now();

        Plant plant = Plant.builder()
                .owner(user)
                .nickname(nickname)
                .species(species)
                .imageUrl(imageUrl)
                .status(plantStatus)
                .plantedDate(pDate)
                .isVerified(isVerified)
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

    @Transactional
    public PlantResponse updatePlant(UUID plantId, String nickname, String species, String status,
            java.time.LocalDate plantedDate, java.time.LocalDate harvestDate, MultipartFile image) {
        Plant plant = plantRepository.findById(plantId)
                .orElseThrow(() -> new IllegalArgumentException("Plant not found"));

        if (nickname != null && !nickname.isBlank()) {
            plant.setNickname(nickname);
        }
        if (species != null) {
            plant.setSpecies(species);
        }
        if (status != null && !status.isBlank()) {
            try {
                plant.setStatus(PlantStatus.valueOf(status.toUpperCase()));
            } catch (IllegalArgumentException e) {
                // Ignore invalid status
            }
        }
        if (plantedDate != null) {
            plant.setPlantedDate(plantedDate);
        }
        if (harvestDate != null) {
            plant.setHarvestDate(harvestDate);
        }

        if (image != null && !image.isEmpty()) {
            String imageUrl = fileStorageService.storeFile(image);
            plant.setImageUrl(imageUrl);
        }

        Plant saved = plantRepository.save(plant);
        return mapToResponse(saved);
    }

    @Transactional
    public void deletePlant(UUID plantId) {
        // 1. Unlink posts
        List<com.plantsocial.backend.model.Post> posts = postRepository.findAllByPlantId(plantId);
        for (com.plantsocial.backend.model.Post post : posts) {
            post.setPlant(null);
        }
        postRepository.saveAll(posts);

        // 2. Delete plant logs
        List<PlantLog> logs = plantLogRepository.findAllByPlantIdOrderByLogDateDesc(plantId);
        plantLogRepository.deleteAll(logs);

        // 3. Delete plant
        plantRepository.deleteById(plantId);
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
                plant.getPlantedDate(),
                plant.getHarvestDate(),
                plant.isVerified(),
                plant.getCreatedAt());
    }

    @Transactional
    public com.plantsocial.backend.dto.LogResponse addLog(UUID plantId, String notes, java.time.LocalDate logDate,
            MultipartFile image) {
        Plant plant = plantRepository.findById(plantId)
                .orElseThrow(() -> new IllegalArgumentException("Plant not found"));

        String imageUrl = null;
        if (image != null && !image.isEmpty()) {
            imageUrl = fileStorageService.storeFile(image);
        }

        PlantLog log = PlantLog.builder()
                .plant(plant)
                .notes(notes)
                .logDate(logDate != null ? logDate : java.time.LocalDate.now())
                .imageUrl(imageUrl)
                .build();

        PlantLog saved = plantLogRepository.save(log);
        return new com.plantsocial.backend.dto.LogResponse(saved.getId(), saved.getImageUrl(), saved.getNotes(),
                saved.getLogDate());
    }

    public List<com.plantsocial.backend.dto.LogResponse> getPlantLogs(UUID plantId) {
        return plantLogRepository.findAllByPlantIdOrderByLogDateDesc(plantId)
                .stream()
                .map(log -> new com.plantsocial.backend.dto.LogResponse(log.getId(), log.getImageUrl(), log.getNotes(),
                        log.getLogDate()))
                .collect(Collectors.toList());
    }

    @Transactional
    public PlantResponse updatePlantPhoto(UUID plantId, MultipartFile image) {
        Plant plant = plantRepository.findById(plantId)
                .orElseThrow(() -> new IllegalArgumentException("Plant not found"));

        User currentUser = getCurrentUser();
        if (!plant.getOwner().getId().equals(currentUser.getId())) {
            throw new org.springframework.security.access.AccessDeniedException("Not authorized");
        }

        if (image != null && !image.isEmpty()) {
            String imageUrl = fileStorageService.storeFile(image);
            plant.setImageUrl(imageUrl);
        }

        Plant saved = plantRepository.save(plant);
        return mapToResponse(saved);
    }

    @Transactional
    public void deleteLog(UUID logId) {
        PlantLog log = plantLogRepository.findById(logId)
                .orElseThrow(() -> new IllegalArgumentException("Log not found"));

        User currentUser = getCurrentUser();
        if (!log.getPlant().getOwner().getId().equals(currentUser.getId())) {
            throw new org.springframework.security.access.AccessDeniedException("Not authorized");
        }
        plantLogRepository.delete(log);
    }

    @Transactional
    public com.plantsocial.backend.dto.LogResponse updateLog(UUID logId, String notes) {
        PlantLog log = plantLogRepository.findById(logId)
                .orElseThrow(() -> new IllegalArgumentException("Log not found"));

        User currentUser = getCurrentUser();
        if (!log.getPlant().getOwner().getId().equals(currentUser.getId())) {
            throw new org.springframework.security.access.AccessDeniedException("Not authorized");
        }

        if (notes != null) {
            log.setNotes(notes);
        }

        PlantLog saved = plantLogRepository.save(log);
        return new com.plantsocial.backend.dto.LogResponse(saved.getId(), saved.getImageUrl(), saved.getNotes(),
                saved.getLogDate());
    }

    private User getCurrentUser() {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        String username;
        if (principal instanceof UserDetails) {
            username = ((UserDetails) principal).getUsername();
        } else {
            username = principal.toString();
        }
        return userRepository.findByUsername(username)
                .or(() -> userRepository.findByEmail(username))
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));
    }
}
