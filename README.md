# PlantSocial

Welcome to PlantSocial! This project is a microservices-based social platform built for plant enthusiasts. 

## 🛠️ Tools & Technologies Used

This project leverages a modern, distributed architecture using the following stack:

- **Frontend**: Angular 17+ (TypeScript, SCSS)
- **Backend & Microservices**: Spring Boot (Java), Spring Cloud Gateway
- **Identity & Access Management (IAM)**: Keycloak (OAuth2 / OpenID Connect)
- **Database**: PostgreSQL (for core data and Keycloak)
- **Real-time Messaging**: Centrifugo & Redis
- **Infrastructure**: Docker & Docker Compose

## 🚀 How to Start the Project

Because this is a distributed system, the order in which you start the services is important. Follow these steps to bring up the entire environment:

### Step 1: Start the Infrastructure (Docker Compose)
First, you need to start the underlying databases, authentication server, and messaging brokers.

1. Open a terminal in the root directory of the project.
2. Run the following command:
   ```bash
   docker-compose up -d
   ```
   This starts:
   - PostgreSQL (Main DB `plantsocial_db` and Keycloak DB `keycloak-db`)
   - Keycloak (IAM Service)
   - Redis (Message broker)
   - Centrifugo (Real-time WebSocket server)

*Wait a few moments for Keycloak and the databases to fully initialize.*

### Step 2: Start the Microservices
Open a separate terminal window for each of the following Spring Boot services and start them. You can start them in parallel, but it's best to let the `backend` spin up first.

1. **Backend Service** (Maven)
   ```bash
   cd backend
   ./mvnw spring-boot:run
   ```

2. **Gamification Service** (Gradle)
   ```bash
   cd gamification-service
   ./gradlew bootRun
   ```

3. **Chat Service** (Maven)
   ```bash
   cd chat-service
   ./mvnw spring-boot:run
   ```

### Step 3: Start the API Gateway
Once the core services are running, start the gateway to route traffic.

1. **API Gateway** (Gradle)
   ```bash
   cd api-gateway
   ./gradlew bootRun
   ```

### Step 4: Start the Frontend Application
Finally, start the Angular frontend.

1. **Frontend** (npm/Angular CLI)
   ```bash
   cd frontend
   npm install   # If you haven't installed dependencies yet
   npm start
   ```

Once the frontend compiles successfully, open your browser and navigate to `http://localhost:4200/`.

## Service Folders
For more details on each specific service, please refer to the `README.md` file located inside each folder:
- `/api-gateway`
- `/backend`
- `/chat-service`
- `/gamification-service`
- `/frontend`
