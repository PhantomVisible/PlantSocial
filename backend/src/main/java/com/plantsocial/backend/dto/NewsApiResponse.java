package com.plantsocial.backend.dto;

import java.util.List;

public record NewsApiResponse(
                String status,
                int totalResults,
                List<NewsArticleDTO> articles) {
}
