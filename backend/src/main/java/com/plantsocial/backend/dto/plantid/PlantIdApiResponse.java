package com.plantsocial.backend.dto.plantid;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

@JsonIgnoreProperties(ignoreUnknown = true)
public record PlantIdApiResponse(
        @JsonProperty("result") PlantIdResult result) {}
