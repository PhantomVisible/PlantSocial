package com.plantsocial.backend.dto.plantnet;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class PlantNetResult {
    private Double score;
    private PlantNetSpecies species;
}
