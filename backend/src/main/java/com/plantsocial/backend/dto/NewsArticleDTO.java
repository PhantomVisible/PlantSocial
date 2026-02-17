package com.plantsocial.backend.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public class NewsArticleDTO {
        private String title;
        private String description;
        private String url;
        private String urlToImage;
        private String publishedAt;

        // NewsAPI sends a nested object for source
        @JsonProperty("source")
        private Source source;

        public NewsArticleDTO() {
        }

        public NewsArticleDTO(String title, String sourceName, String url, String urlToImage, String publishedAt,
                        String description) {
                this.title = title;
                this.url = url;
                this.urlToImage = urlToImage;
                this.publishedAt = publishedAt;
                this.description = description;
                this.source = new Source();
                this.source.setName(sourceName);
        }

        // Helper method for the Frontend to get a clean name
        public String getSourceName() {
                return source != null ? source.getName() : "Unknown Source";
        }

        // Getters and Setters
        public String getTitle() {
                return title;
        }

        public void setTitle(String title) {
                this.title = title;
        }

        public String getDescription() {
                return description;
        }

        public void setDescription(String description) {
                this.description = description;
        }

        public String getUrl() {
                return url;
        }

        public void setUrl(String url) {
                this.url = url;
        }

        public String getUrlToImage() {
                return urlToImage;
        }

        public void setUrlToImage(String urlToImage) {
                this.urlToImage = urlToImage;
        }

        public String getPublishedAt() {
                return publishedAt;
        }

        public void setPublishedAt(String publishedAt) {
                this.publishedAt = publishedAt;
        }

        public Source getSource() {
                return source;
        }

        public void setSource(Source source) {
                this.source = source;
        }

        // Static Inner Class to handle { "id": null, "name": "BBC" }
        public static class Source {
                private String id;
                private String name;

                public String getId() {
                        return id;
                }

                public void setId(String id) {
                        this.id = id;
                }

                public String getName() {
                        return name;
                }

                public void setName(String name) {
                        this.name = name;
                }
        }
}
