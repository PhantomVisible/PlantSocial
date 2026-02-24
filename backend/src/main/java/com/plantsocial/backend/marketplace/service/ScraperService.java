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

            // Connect using Jsoup with realistic headers to avoid blocking
            Document doc = Jsoup.connect(url)
                    .userAgent(
                            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")
                    .header("Accept",
                            "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8")
                    .header("Accept-Language", "en-US,en;q=0.9")
                    .header("Accept-Encoding", "gzip, deflate, br")
                    .header("Connection", "keep-alive")
                    .header("Upgrade-Insecure-Requests", "1")
                    .header("Sec-Fetch-Dest", "document")
                    .header("Sec-Fetch-Mode", "navigate")
                    .header("Sec-Fetch-Site", "none")
                    .header("Sec-Fetch-User", "?1")
                    .header("Cache-Control", "max-age=0")
                    .cookie("i18n-prefs", "USD")
                    .cookie("lc-main", "en_US")
                    .cookie("session-id", "147-9876543-1234567") // Dummy session to bind prefs
                    .timeout(15000)
                    .get();

            // Extract Open Graph tags
            String title = doc.select("meta[property=og:title]").attr("content");
            String image = doc.select("meta[property=og:image]").attr("content");
            String description = doc.select("meta[property=og:description]").attr("content");

            // Extract Standard Meta Tags
            if (description.isEmpty()) {
                description = doc.select("meta[name=description]").attr("content");
            }

            // Fallback for Amazon and other sites without OG tags
            if (title.isEmpty()) {
                title = doc.select("#productTitle").text(); // Amazon
                if (title.isEmpty())
                    title = doc.title();
            }
            if (image.isEmpty()) {
                image = doc.select("#landingImage").attr("src"); // Amazon
                if (image.isEmpty() || image.contains("data:image")) {
                    image = doc.select("#imgBlkFront").attr("src"); // Amazon Book
                }
                if (image.isEmpty()) {
                    // Try to find the first significant image
                    image = doc.select("img[src~=(?i)\\.(png|jpe?g)]").attr("abs:src");
                }
            }
            if (description.isEmpty()) {
                // Try Amazon feature bullets or product description
                description = doc.select("#feature-bullets ul li").text(); // Amazon
                if (description.isEmpty()) {
                    description = doc.select("#productDescription p").text();
                }
            }

            // Cleanup length if it's super long (e.g. all amazon bullets)
            if (description.length() > 500) {
                description = description.substring(0, 497) + "...";
            }

            // Extract Price (especially for Amazon)
            java.math.BigDecimal productPrice = null;
            try {
                String priceStr = doc.select("meta[property=product:price:amount]").attr("content");
                if (priceStr.isEmpty()) {
                    org.jsoup.nodes.Element offscreen = doc.selectFirst(".a-price .a-offscreen");
                    priceStr = offscreen != null ? offscreen.text() : "";
                }
                if (priceStr.isEmpty()) {
                    priceStr = doc.select("#priceblock_ourprice").text();
                }
                if (priceStr.isEmpty()) {
                    priceStr = doc.select("#priceblock_dealprice").text();
                }
                if (!priceStr.isEmpty()) {
                    // Clean up currency symbols and commas
                    priceStr = priceStr.replaceAll("[^\\d.]", "");
                    if (!priceStr.isEmpty()) {
                        productPrice = new java.math.BigDecimal(priceStr);
                    }
                }
            } catch (Exception e) {
                log.warn("Could not extract price from {}", url);
            }

            log.info("Successfully scraped: Title={}, Image={}, Price={}", title, image, productPrice);
            return new ProductPreviewDTO(title, image, description, url, productPrice);

        } catch (Exception e) {
            log.error("Failed to scrape URL: {} - Error: {}", url, e.getMessage());
            // Return a safe DTO so the frontend doesn't crash
            return new ProductPreviewDTO("", "", "", url, null);
        }
    }
}
