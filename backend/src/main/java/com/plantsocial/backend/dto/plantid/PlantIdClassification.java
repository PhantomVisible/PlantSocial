package com.plantsocial.backend.dto.plantid;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.List;

@JsonIgnoreProperties(ignoreUnknown = true)
public record PlantIdClassification(
        @JsonProperty("suggestions") List<PlantIdSuggestion> suggestions) {}
