package com.plantsocial.backend.dto.plantid;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

@JsonIgnoreProperties(ignoreUnknown = true)
public record PlantIdResult(
        @JsonProperty("classification") PlantIdClassification classification) {}
