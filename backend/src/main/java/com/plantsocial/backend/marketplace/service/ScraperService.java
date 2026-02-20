package com.plantsocial.backend.marketplace.service;

import com.plantsocial.backend.marketplace.dto.ProductPreviewDTO;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.springframework.stereotype.Service;

@Service
@lombok.extern.slf4j.Slf4j
public class ScraperService {

    public ProductPreviewDTO fetchMetaData(String url) {
        try {
            log.info("Scraping URL: {}", url);
            // Validate URL protocol
            if (!url.startsWith("http")) {
                url = "https://" + url;
            }

            // Connect using Jsoup with a standard User-Agent to avoid blocking
            Document doc = Jsoup.connect(url)
                    .userAgent(
                            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36")
                    .header("Accept-Language", "en-US,en;q=0.9")
                    .timeout(10000)
                    .referrer("http://google.com")
                    .get();

            // Extract Open Graph tags
            String title = doc.select("meta[property=og:title]").attr("content");
            String image = doc.select("meta[property=og:image]").attr("content");

            // Fallback if OG tags are missing
            if (title.isEmpty()) {
                title = doc.title();
            }
            if (image.isEmpty()) {
                // Try to find the first significant image
                image = doc.select("img[src~=(?i)\\.(png|jpe?g)]").attr("abs:src");
            }

            log.info("Successfully scraped: Title={}, Image={}", title, image);
            return new ProductPreviewDTO(title, image, url);

        } catch (Exception e) {
            log.error("Failed to scrape URL: {} - Error: {}", url, e.getMessage());
            // Return a safe DTO so the frontend doesn't crash
            return new ProductPreviewDTO("", "", url);
        }
    }
}
