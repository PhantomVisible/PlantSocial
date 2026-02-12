package com.plantsocial.backend.repository;

import com.plantsocial.backend.model.Plant;
import com.plantsocial.backend.model.PlantStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface PlantRepository extends JpaRepository<Plant, UUID> {

    List<Plant> findByOwnerIdAndStatusOrderByCreatedAtDesc(UUID ownerId, PlantStatus status);

    List<Plant> findByOwnerIdOrderByCreatedAtDesc(UUID ownerId);
}
