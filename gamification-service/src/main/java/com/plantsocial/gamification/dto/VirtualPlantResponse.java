package com.plantsocial.gamification.dto;

import com.plantsocial.gamification.model.VirtualPlant;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class VirtualPlantResponse {
    private VirtualPlant plant;
    private String message;
}
