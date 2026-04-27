# Xyla - Project Brain & Context

## 🌍 Project Overview

Xyla is an independent, community-driven social media platform tailored for plant lovers and gardening enthusiasts. The platform emphasizes organic community growth, high-end design ("Main Character energy"), and frictionless real-time interactions.
**Core Philosophy:** Architecture first, aesthetics always. Built for enterprise scale from Day 1 using a microservices pattern, while maintaining a cinematic, minimalist UI (lush greens, dark mode accents, clean typography).

## 🛠️ Tech Stack

- **Frontend:** Angular 17, TypeScript, SCSS/CSS.
- **Backend (Microservices):** Java, Spring Boot 3, Spring Security (OAuth2 Resource Server).
- **API Gateway:** Spring Cloud Gateway.
- **Identity & Access Management (IAM):** Keycloak (with custom FTL/CSS theming and JIT database provisioning).
- **Real-Time Infrastructure:** Centrifugo (WebSockets for Chat & Notifications).
- **Database:** PostgreSQL.
- **Object Storage:** MinIO (Local S3-compatible storage for media/avatars).
- **Infrastructure:** Docker & Docker Compose (for local dev orchestration).

## 📂 Folder Structure

```text
/
├── frontend/                 # Angular 17 SPA
│   ├── src/app/auth/         # Auth interceptors, state management
│   ├── src/app/services/     # Singleton services (WebSocket, Chat, Notifications)
│   └── src/styles.css        # Global CSS, variables, and themes
├── api-gateway/              # Spring Cloud Gateway (handles routing & global CORS)
├── backend/                  # Main Spring Boot monolith (Feed, Profile, Users)
│   └── src/main/java/com/plantsocial/backend/security/ # Contains JIT Provisioning (JwtUserSyncFilter)
├── chat-service/             # Spring Boot microservice for Chat REST APIs
├── gamification-service/     # Spring Boot microservice for Gamification
├── centrifugo/               # Configuration files and rules for Centrifugo WebSocket server
├── keycloak-theme/           # Custom Keycloak UI (FTL templates, custom CSS)
│   └── plantsocial/login/resources/css/styles.css
└── docker-compose.yml        # Orchestrates Keycloak, Postgres, Centrifugo, MinIO
```

## 💻 Developer Commands

Start Infrastructure (Databases, Keycloak, Centrifugo, MinIO):
docker compose up -d (Use --force-recreate if modifying volume mounts like Keycloak themes).
(Note: MinIO Console is typically accessible via Docker port mapping, e.g., http://localhost:9001).

Start API Gateway (Port 9000):
cd api-gateway && ./mvnw spring-boot:run

Start Main Backend (Port 8080):
cd backend && ./mvnw spring-boot:run

Start Chat Service (Port 8083):
cd chat-service && ./mvnw spring-boot:run

Start Gamification Service (Port 8081):
cd gamification-service && ./mvnw spring-boot:run

Start Frontend (Port 4200):
cd frontend && npm start (or ng serve)

## 📐 Coding Standards & Architecture

Frontend (Angular)
STRICT NO INLINE CSS: Never use style="..." in HTML templates. All styling must be extracted to the component's .scss file or global styles.css.

Service Singletons: Services managing WebSocket connections (e.g., WebSocketService, Centrifugo) must be strict singletons (providedIn: 'root') to prevent memory leaks and duplicate channel subscriptions.

RxJS Management: Always unsubscribe from Angular Observables using ngOnDestroy or takeUntilDestroyed to prevent memory leaks.

Backend (Spring Boot & Gateway)
CORS Handling: Global CORS is handled exclusively by the api-gateway. Do not add @CrossOrigin or .cors() configurations to downstream microservices, as this causes "Double Bouncer" preflight failures.

Stateless Auth: Downstream services rely completely on the Keycloak JWT. User provisioning is handled Just-In-Time (JIT) via the JwtUserSyncFilter utilizing a ConcurrentHashMap for highly optimized, DB-sparing authentication checks.

DTOs over Entities: Never return raw JPA entities to the frontend. Always map entities to DTOs before serialization.

## 🚫 Strict Rules & Guardrails

Never commit secrets: Never hardcode S3 credentials, Keycloak admin passwords, or Centrifugo HMAC secrets in the code. Rely on environment variables (application.yml referencing ${ENV_VAR}).

Brand Fidelity: UI components must adhere to the Xyla dark-mode/green-gradient palette. Avoid generic "Bootstrap-style" primary blue buttons.

Idempotency in Real-time: WebSocket subscriptions must be checked for existence before subscribing to prevent duplicate Centrifugo Error: Subscription already exists crashes.

No Legacy Auth: Do not implement manual JWT parsing, localStorage token hacks, or custom login forms. All auth must redirect to the Keycloak Identity Provider using the standard OAuth2/OIDC flow.
