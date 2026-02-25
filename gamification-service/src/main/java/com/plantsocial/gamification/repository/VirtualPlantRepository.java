package com.plantsocial.gamification.repository;

import com.plantsocial.gamification.model.VirtualPlant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface VirtualPlantRepository extends JpaRepository<VirtualPlant, Long> {
    Optional<VirtualPlant> findByUserId(Long userId);
}
