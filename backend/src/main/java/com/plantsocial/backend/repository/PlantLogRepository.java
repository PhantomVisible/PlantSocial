package com.plantsocial.backend.repository;

import com.plantsocial.backend.model.PlantLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface PlantLogRepository extends JpaRepository<PlantLog, UUID> {
    List<PlantLog> findAllByPlantIdOrderByLogDateDesc(UUID plantId);
}
