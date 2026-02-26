package com.plantsocial.gamification.repository;

import com.plantsocial.gamification.model.VirtualPlant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface VirtualPlantRepository extends JpaRepository<VirtualPlant, Long> {
    List<VirtualPlant> findByUserId(Long userId);

    List<VirtualPlant> findTop10ByOrderByCreatedAtAsc();
}
