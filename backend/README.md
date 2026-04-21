# Backend Service

This is the main Spring Boot backend service for PlantSocial, handling core business logic, user management, and posts.

## Prerequisites
- Java 21 (or compatible version)
- Maven
- PostgreSQL (Provided via Docker Compose in the root)
- Keycloak (Provided via Docker Compose in the root)

## How to Start

Ensure that the infrastructure services (Database, Keycloak, etc.) are already running via Docker Compose in the root directory.

1. Open a terminal in the `backend` directory.
2. Run the application using Maven:
   ```bash
   ./mvnw spring-boot:run
   ```
   (On Windows use `mvnw.cmd spring-boot:run`)

The backend service will start and connect to the local database and Keycloak instance.
