package com.plantsocial.backend.dto.plantnet;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;

import java.util.List;

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class PlantNetResponse {
    private List<PlantNetResult> results;
}
