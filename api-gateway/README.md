# API Gateway

This is the Spring Cloud API Gateway for the PlantSocial project. It acts as the central entry point for all client requests, routing them to the appropriate microservices.

## Prerequisites
- Java 21 (or compatible version)
- Gradle

## How to Start

1. Open a terminal in the `api-gateway` directory.
2. Run the application using Gradle:
   ```bash
   ./gradlew bootRun
   ```
   (On Windows use `gradlew.bat bootRun`)

The API Gateway will start and listen on the configured port (usually `8080` if acting as the main entry point, or another configured port in application.yml).
