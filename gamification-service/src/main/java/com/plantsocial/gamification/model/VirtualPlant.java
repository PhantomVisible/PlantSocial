package com.plantsocial.gamification.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "virtual_plants")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class VirtualPlant {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String userId;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String species;

    @Column(nullable = false)
    private int hydration = 80;

    @Column(nullable = false)
    private int cleanliness = 80;

    @Column(nullable = false)
    private String stage = "SEED"; // SEED, SPROUT, SAPLING, BLOOM, ANCIENT

    @Column(name = "last_watered")
    private LocalDateTime lastWatered;

    @Column(name = "last_cleaned")
    private LocalDateTime lastCleaned;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @Transient
    private long daysAlive;

    @PostLoad
    @PostPersist
    @PostUpdate
    public void calculateDaysAlive() {
        if (this.createdAt != null) {
            this.daysAlive = java.time.temporal.ChronoUnit.DAYS.between(this.createdAt, LocalDateTime.now());
        } else {
            this.daysAlive = 0;
        }
    }

    @PrePersist
    public void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    public void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public boolean isDead() {
        return this.hydration <= 0;
    }
}
