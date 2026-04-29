package com.plantsocial.backend.marketplace.service;

import com.plantsocial.backend.marketplace.dto.ProductPreviewDTO;
import org.jsoup.HttpStatusException;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.math.BigDecimal;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
@lombok.extern.slf4j.Slf4j
public class ScraperService {

    private static final int MAX_IMAGES = 5;
    private static final String BROWSER_UA =
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";
    private static final String GOOGLEBOT_UA =
            "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)";

    private static final Pattern PRICE_CLEAN   = Pattern.compile("[\\d]+\\.?\\d*");
    private static final Pattern JSON_IMG_SINGLE = Pattern.compile("\"image\"\\s*:\\s*\"(https?[^\"]+)\"");
    private static final Pattern JSON_IMG_ARRAY  = Pattern.compile("\"image\"\\s*:\\s*\\[([^\\]]+)\\]");
    private static final Pattern JSON_URL        = Pattern.compile("\"(https?[^\"]+)\"");
    private static final Pattern JSON_CURRENCY   = Pattern.compile("\"priceCurrency\"\\s*:\\s*\"([A-Z]{3})\"");

    // ── Public entry point ────────────────────────────────────────────────────

    public ProductPreviewDTO fetchMetaData(String url) {
        if (!url.startsWith("http")) url = "https://" + url;

        Document doc = null;
        try {
            doc = fetchPage(url);
        } catch (Exception e) {
            log.error("All fetch attempts failed for {}: {}", url, e.getMessage());
        }

        if (doc == null) {
            // Last resort: build partial DTO from the URL itself
            String slugTitle = titleFromSlug(url);
            log.info("Returning URL-slug fallback title='{}' for {}", slugTitle, url);
            return new ProductPreviewDTO(slugTitle, List.of(), "", url, null, "USD");
        }

        return extract(doc, url);
    }

    // ── Fetch with three-tier retry ───────────────────────────────────────────

    /**
     * Tier 1 – Jsoup with full browser headers (works for most sites).
     * Tier 2 – Jsoup with Googlebot UA (many sites whitelist crawlers).
     * Tier 3 – Java HttpClient with HTTP/2 (different TLS fingerprint than Jsoup).
     */
    private Document fetchPage(String url) throws Exception {

        // Tier 1: browser headers
        try {
            log.info("[Tier 1] Fetching {}", url);
            return Jsoup.connect(url)
                    .userAgent(BROWSER_UA)
                    .header("Accept", "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8")
                    .header("Accept-Language", "en-US,en;q=0.9")
                    .header("Accept-Encoding", "gzip, deflate, br")
                    .header("Connection", "keep-alive")
                    .header("Upgrade-Insecure-Requests", "1")
                    .header("Sec-Fetch-Dest", "document")
                    .header("Sec-Fetch-Mode", "navigate")
                    .header("Sec-Fetch-Site", "none")
                    .header("Sec-Fetch-User", "?1")
                    .header("Cache-Control", "max-age=0")
                    .header("sec-ch-ua", "\"Chromium\";v=\"124\", \"Google Chrome\";v=\"124\", \"Not-A.Brand\";v=\"99\"")
                    .header("sec-ch-ua-mobile", "?0")
                    .header("sec-ch-ua-platform", "\"Windows\"")
                    .cookie("i18n-prefs", "USD")
                    .cookie("lc-main", "en_US")
                    .timeout(8000)
                    .get();
        } catch (HttpStatusException e) {
            if (e.getStatusCode() != 403 && e.getStatusCode() != 429) throw e;
            log.warn("[Tier 1] Got {} for {}, trying Googlebot UA", e.getStatusCode(), url);
        }

        // Tier 2: Googlebot UA (most sites explicitly allow crawlers)
        try {
            log.info("[Tier 2] Fetching {} with Googlebot UA", url);
            Document doc = Jsoup.connect(url)
                    .userAgent(GOOGLEBOT_UA)
                    .header("Accept", "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8")
                    .header("Accept-Language", "en-US,en;q=0.9")
                    .header("Referer", "https://www.google.com/")
                    .ignoreHttpErrors(true)
                    .timeout(6000)
                    .get();
            if (!doc.select("meta[property=og:title], #productTitle, h1").isEmpty()) {
                return doc;
            }
            log.warn("[Tier 2] Response had no useful content for {}", url);
        } catch (Exception e) {
            log.warn("[Tier 2] Failed for {}: {}", url, e.getMessage());
        }

        // Tier 3: Java HttpClient with HTTP/2 (different TLS/ALPN fingerprint)
        log.info("[Tier 3] Fetching {} via Java HttpClient HTTP/2", url);
        HttpClient client = HttpClient.newBuilder()
                .version(HttpClient.Version.HTTP_2)
                .followRedirects(HttpClient.Redirect.ALWAYS)
                .connectTimeout(Duration.ofSeconds(6))
                .build();

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(url))
                .header("User-Agent", BROWSER_UA)
                .header("Accept", "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8")
                .header("Accept-Language", "en-US,en;q=0.9")
                .header("Referer", "https://www.google.com/")
                .timeout(Duration.ofSeconds(8))
                .GET()
                .build();

        HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
        log.info("[Tier 3] Status {} for {}", response.statusCode(), url);

        Document doc = Jsoup.parse(response.body(), url);
        if (response.statusCode() >= 400 && doc.select("meta[property=og:title], h1").isEmpty()) {
            throw new IOException("Tier 3 returned status " + response.statusCode() + " with no parseable content");
        }
        return doc;
    }

    // ── Data extraction ────────────────────────────────────────────────────────

    private ProductPreviewDTO extract(Document doc, String url) {
        // Title
        String title = doc.select("meta[property=og:title]").attr("content");
        if (title.isEmpty()) title = doc.select("#productTitle").text();
        if (title.isEmpty()) title = doc.select("h1").first() != null ? doc.select("h1").first().text() : "";
        if (title.isEmpty()) title = doc.title();
        if (title.isEmpty()) title = titleFromSlug(url);

        // Description
        String description = doc.select("meta[property=og:description]").attr("content");
        if (description.isEmpty()) description = doc.select("meta[name=description]").attr("content");
        if (description.isEmpty()) description = doc.select("#feature-bullets ul li").text();
        if (description.isEmpty()) description = doc.select("#productDescription p").text();
        if (description.length() > 500) description = description.substring(0, 497) + "...";

        // Images
        List<String> imageUrls = extractImages(doc);

        // Price + currency
        BigDecimal productPrice = extractPrice(doc);
        String currency = extractCurrency(doc);

        log.info("Extracted: title='{}', images={}, price={}, currency={}", title, imageUrls.size(), productPrice, currency);
        return new ProductPreviewDTO(title, imageUrls, description, url, productPrice, currency);
    }

    // ── Image extraction ───────────────────────────────────────────────────────

    private List<String> extractImages(Document doc) {
        LinkedHashSet<String> set = new LinkedHashSet<>();

        // OG images (may be multiple)
        doc.select("meta[property=og:image]").forEach(el -> addImage(set, el.attr("content")));

        // Amazon
        addImage(set, doc.select("#landingImage").attr("src"));
        addImage(set, doc.select("#imgBlkFront").attr("src"));
        doc.select("#altImages li img, #imageBlock_feature_div img").forEach(img -> {
            String src = img.attr("src").replaceAll("\\._[A-Z]{2}[^_.]*_\\.", "._SL500_.");
            addImage(set, src);
        });

        // Etsy: main listing image
        doc.select("img[data-listing-id], img.wt-max-width-full, img[data-src]").forEach(img -> {
            String src = img.hasAttr("data-src") ? img.attr("data-src") : img.attr("src");
            addImage(set, src);
        });

        // JSON-LD images
        for (Element script : doc.select("script[type=application/ld+json]")) {
            String json = script.html();
            Matcher arrMatcher = JSON_IMG_ARRAY.matcher(json);
            if (arrMatcher.find()) {
                Matcher urlMatcher = JSON_URL.matcher(arrMatcher.group(1));
                while (urlMatcher.find()) addImage(set, urlMatcher.group(1));
            }
            Matcher singleMatcher = JSON_IMG_SINGLE.matcher(json);
            while (singleMatcher.find()) addImage(set, singleMatcher.group(1));
        }

        // Generic fallback
        if (set.isEmpty()) {
            addImage(set, doc.select("img[src~=(?i)\\.(png|jpe?g)]").attr("abs:src"));
        }

        return new ArrayList<>(set).subList(0, Math.min(set.size(), MAX_IMAGES));
    }

    private void addImage(LinkedHashSet<String> set, String src) {
        if (src != null && !src.isEmpty() && !src.startsWith("data:") && set.size() < MAX_IMAGES) {
            set.add(src);
        }
    }

    // ── Price extraction ───────────────────────────────────────────────────────

    private BigDecimal extractPrice(Document doc) {
        try {
            String raw = doc.select("meta[property=product:price:amount]").attr("content");

            if (raw.isEmpty()) {
                Element offscreen = doc.selectFirst(".a-price .a-offscreen");
                raw = offscreen != null ? offscreen.text() : "";
            }
            if (raw.isEmpty()) raw = doc.select("#priceblock_ourprice, #priceblock_dealprice").text();

            // Etsy price
            if (raw.isEmpty()) {
                Element etsyPrice = doc.selectFirst("[data-buy-box-region] .currency-value, .wt-text-title-largest");
                raw = etsyPrice != null ? etsyPrice.text() : "";
            }

            // JSON-LD fallback
            if (raw.isEmpty()) {
                for (Element script : doc.select("script[type=application/ld+json]")) {
                    Matcher m = Pattern.compile("\"price\"\\s*:\\s*\"?([\\d.,]+)\"?").matcher(script.html());
                    if (m.find()) { raw = m.group(1); break; }
                }
            }

            if (!raw.isEmpty()) {
                String cleaned = raw.replaceAll("[^\\d.]", "");
                Matcher m = PRICE_CLEAN.matcher(cleaned);
                if (m.find()) return new BigDecimal(m.group());
            }
        } catch (Exception e) {
            log.warn("Price extraction failed: {}", e.getMessage());
        }
        return null;
    }

    // ── Currency extraction ────────────────────────────────────────────────────

    private String extractCurrency(Document doc) {
        String currency = doc.select("meta[property=product:price:currency]").attr("content");
        if (!currency.isEmpty()) return currency.toUpperCase();

        for (Element script : doc.select("script[type=application/ld+json]")) {
            Matcher m = JSON_CURRENCY.matcher(script.html());
            if (m.find()) return m.group(1);
        }
        return "USD";
    }

    // ── URL-slug title fallback ────────────────────────────────────────────────

    private String titleFromSlug(String url) {
        try {
            String path = new URI(url).getPath();
            String[] parts = path.split("/");
            // Use the last non-numeric, non-empty segment
            for (int i = parts.length - 1; i >= 0; i--) {
                String seg = parts[i];
                if (!seg.isEmpty() && !seg.matches("\\d+")) {
                    return Arrays.stream(seg.split("[-_]"))
                            .filter(w -> !w.isEmpty())
                            .map(w -> Character.toUpperCase(w.charAt(0)) + w.substring(1).toLowerCase())
                            .collect(Collectors.joining(" "));
                }
            }
        } catch (Exception ignored) {}
        return "";
    }
}
