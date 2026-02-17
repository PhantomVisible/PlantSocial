package com.plantsocial.backend.controller;

import com.plantsocial.backend.dto.NewsArticleDTO;
import com.plantsocial.backend.service.NewsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/news")
@RequiredArgsConstructor
public class NewsController {

    private final NewsService newsService;

    @GetMapping("/trending")
    public ResponseEntity<List<NewsArticleDTO>> getTrendingNews() {
        return ResponseEntity.ok(newsService.getTopNews());
    }
}
