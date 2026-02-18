package com.plantsocial.backend.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.plantsocial.backend.dto.NewsApiResponse;
import com.plantsocial.backend.dto.NewsArticleDTO;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class NewsService {

    private final RestTemplate restTemplate;

    @Value("${news.api.key}")
    private String apiKey;

    @Value("${news.api.url}")
    private String apiUrl;

    private List<NewsArticleDTO> cachedNews = new ArrayList<>();

    @PostConstruct
    public void init() {
        fetchNews();
    }

    // Fetch every 6 hours (6 * 60 * 60 * 1000 = 21600000 ms)
    @Scheduled(fixedRate = 21600000)
    public void fetchNews() {
        log.info("Fetching latest plant news...");
        try {
            String url = UriComponentsBuilder.fromHttpUrl(apiUrl)
                    .queryParam("q", "gardening")
                    .queryParam("language", "en")
                    .queryParam("sortBy", "relevancy")
                    .queryParam("pageSize", "40")
                    .queryParam("apiKey", apiKey)
                    .toUriString();

            String jsonResponse = restTemplate.getForObject(url, String.class);
            log.info("DEBUG RAW JSON: {}", jsonResponse);

            ObjectMapper mapper = new ObjectMapper();
            // Configure mapper to ignore unknown properties just in case
            mapper.configure(com.fasterxml.jackson.databind.DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);

            NewsApiResponse response = mapper.readValue(jsonResponse, NewsApiResponse.class);

            if (response != null && "ok".equals(response.status()) && response.articles() != null) {
                // Atomic-like replacement
                this.cachedNews = response.articles();
                log.info("Successfully updated news cache with {} articles", this.cachedNews.size());
            } else {
                log.warn("NewsAPI response was invalid or empty: {}", response);
            }

        } catch (Exception e) {
            log.error("Failed to fetch news. Keeping existing cache. Error: {}", e.getMessage(), e);
        }
    }

    public List<NewsArticleDTO> getTopNews() {
        return cachedNews;
    }
}
