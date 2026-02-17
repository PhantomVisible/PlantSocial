package com.plantsocial.backend.config;

import io.github.cdimascio.dotenv.Dotenv;
import org.springframework.context.annotation.Configuration;

@Configuration
public class DotenvConfig {
    static {
        // Load .env file (newsapi.env)
        // We use .filename("newsapi.env") to specify the custom name
        Dotenv dotenv = Dotenv.configure()
                .filename("newsapi.env")
                .ignoreIfMissing()
                .load();

        // Set system properties so Spring can pick them up via ${PLACEHOLDER}
        dotenv.entries().forEach(entry -> {
            System.setProperty(entry.getKey(), entry.getValue());
        });
    }
}