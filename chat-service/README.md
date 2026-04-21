# Chat Service

This is the real-time chat service for PlantSocial. It handles messaging and integrates with Centrifugo and Redis for real-time WebSocket communication.

## Prerequisites
- Java 21 (or compatible version)
- Maven
- Redis (Provided via Docker Compose in the root)
- Centrifugo (Provided via Docker Compose in the root)

## How to Start

Ensure that Redis, Centrifugo, and other core services are already running via Docker Compose in the root directory.

1. Open a terminal in the `chat-service` directory.
2. Run the application using Maven:
   ```bash
   ./mvnw spring-boot:run
   ```
   (On Windows use `mvnw.cmd spring-boot:run`)

The chat service will start and integrate with the messaging infrastructure.
