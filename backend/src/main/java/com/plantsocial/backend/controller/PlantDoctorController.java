package com.plantsocial.backend.controller;

import com.plantsocial.backend.dto.DiagnosisDTO;
import com.plantsocial.backend.service.PlantDoctorService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/v1/plant-doctor")
@RequiredArgsConstructor
public class PlantDoctorController {

    private final PlantDoctorService plantDoctorService;

    @PostMapping(value = "/diagnose", consumes = "multipart/form-data")
    public ResponseEntity<DiagnosisDTO> diagnose(@RequestParam("image") MultipartFile image) {
        if (image.isEmpty()) {
            return ResponseEntity.badRequest().build();
        }
        return ResponseEntity.ok(plantDoctorService.diagnose(image));
    }
}
