package com.plantsocial.backend.controller;

import com.plantsocial.backend.dto.TrendDTO;
import com.plantsocial.backend.service.TrendService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/trends")
@RequiredArgsConstructor
public class TrendController {

    private final TrendService trendService;

    @GetMapping
    public ResponseEntity<List<TrendDTO>> getTrendingTopics(
            @org.springframework.web.bind.annotation.RequestParam(required = false) String tag) {
        return ResponseEntity.ok(trendService.getTrendingTopics(tag));
    }
}
