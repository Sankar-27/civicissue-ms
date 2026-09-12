# CivicIssue

A production-grade smart civic complaint management platform. Citizens report
road, water, sanitation, streetlight, drainage and electricity issues, track
them through a lifecycle, and admins triage, assign to departments and resolve
them — with duplicate detection, real-time notifications and full observability.

Built as a full **Java 21 / Spring Boot 3** backend with a **React** SPA
frontend, orchestrated with **Docker Compose** and deployable to **Kubernetes**
with a **GitHub Actions** CI pipeline.

---

## Features

- **Role-based access control** — `CITIZEN` and `ADMIN` roles with protected
  REST endpoints and JWT authentication.
- **Issue lifecycle** — `OPEN → UNDER_REVIEW → ASSIGNED → IN_PROGRESS →
  RESOLVED → CLOSED` (and `REJECTED`), with an audited timeline of status
  changes and comments.
- **Categories** — `ROAD`, `WATER`, `ELECTRICITY`, `SANITATION`,
  `STREETLIGHT`, `DRAINAGE`, `OTHER`.
- **Duplicate detection** — new issues are checked against nearby unresolved
  issues (Haversine distance within 100 m) in the same category so the
  reporter is immediately told their issue may already be reported.
- **Mapping** — issues carry lat/long coordinates; a map picker is provided in
  the report flow and nearby issues can be surfaced around a point.
- **Department assignment** — admins assign issues to departments
  (e.g. Water Board, Electricity Board, Sanitation, Roads) with notes.
- **Notifications** — in-app notification feed + unread counts, delivered
  asynchronously over Kafka.
- **Comments** — citizens and admins discuss a specific issue.
- **Admin dashboard** — aggregate stats, counts by status/category, and
  recent activity.
- **Image uploads** — evidence photos stored on disk and served through
  `/uploads`.
- **OpenAPI / Swagger UI** and structured `ApiResponse` envelope on every
  endpoint.

---

## Tech stack

| Layer      | Technology |
|------------|------------|
| Language   | Java 21 |
| Backend    | Spring Boot 3.2.5, Spring Security, Spring Data JPA, Spring Data MongoDB |
| Databases  | PostgreSQL (relational core), MongoDB (notifications) |
| Messaging  | Apache Kafka (event-driven notifications) |
| Caching    | Redis |
| Migrations | Flyway |
| Frontend   | React 18, Vite, React Router, Axios |
| API docs   | springdoc-openapi (Swagger UI) |
| Container  | Docker, Docker Compose |
| Orchestration | Kubernetes (manifests under `k8s/`) |
| CI/CD      | GitHub Actions (`./mvnw test`) |
| Auth       | JWT (configurable `JWT_SECRET`) |

### Data model

- **PostgreSQL** (via JPA/Flyway): `users`, `departments`,
  `user_departments`, `issues`, `issue_comments`, `issue_timeline`,
  `issue_category_department` (category→department mapping) etc. Schema is
  defined and versioned in
  `backend/src/main/resources/db/migration/V1__init_schema.sql` and
  `V2__seed_reference_data.sql`.
- **MongoDB**: `notifications` documents (one per user).

### Event-driven notifications (Kafka)

Status changes and comments publish events to Kafka topics
(`issue.status.changed`, `issue.commented`, ...). A consumer builds
`Notification` documents in MongoDB and publishes them to a Redis channel so
connected clients can live-update. The Kafka topic/broker configuration is in
`backend/src/main/java/com/civicissue/config/KafkaConfig.java`, publishers in
`.../kafka/KafkaEventPublisher.java`, and consumers in
`.../kafka/KafkaConsumers.java`.

### Duplicate detection

On issue creation the service searches for unresolved issues within 100 m
(same category) using a Haversine calculation
(`.../service/impl/IssueServiceImpl.java`).

---

## Project layout

```
civicissue/
├── backend/                    # Spring Boot 3 application
│   ├── src/main/java/com/civicissue/
│   │   ├── config/             # Security, Mongo, Redis, Kafka, Swagger, Storage, Cors, Web
│   │   ├── controller/         # Auth, User, Admin, Issue, Department, Comment, Notification, Health
│   │   ├── dto/                # Request/response payloads
│   │   ├── entity/             # JPA entities + enums
│   │   ├── exception/          # GlobalExceptionHandler + ApiResponse envelope
│   │   ├── kafka/              # KafkaEventPublisher, KafkaConsumers
│   │   ├── model/              # Mongo documents + repositories
│   │   ├── repository/         # Spring Data JPA repositories
│   │   ├── security/           # JWT provider/filter, user details
│   │   └── service/            # Business logic (impl) + SeedData
│   ├── src/main/resources/
│   │   ├── application.yml     # default / docker / test profiles
│   │   └── db/migration/       # Flyway V1__init_schema.sql, V2__seed_reference_data.sql
│   ├── src/test/               # Unit + integration tests
│   ├── pom.xml
│   ├── Dockerfile
│   └── mvnw / mvnw.cmd         # Maven wrapper
├── frontend/                   # React (Vite) SPA
│   ├── src/
│   │   ├── components/         # Navbar, Layout, ProtectedRoute, IssueCard, badges, timeline, ...
│   │   ├── context/AuthContext.jsx
│   │   ├── pages/              # Login, Register, Citizen Dashboard, Report Issue, Issue Detail,
│   │   │                       # Notifications, Admin Dashboard, User Management,
│   │   │                       # Department Management, Admin Issue Detail, NotFound
│   │   └── services/api.js     # Axios client (auto-attaches JWT, unwraps ApiResponse)
│   ├── Dockerfile
│   └── nginx.conf              # proxies /api and /uploads to backend
├── k8s/                        # namespace, configmap, secrets, postgres, mongodb,
│   │                           # redis, kafka-zookeeper, backend, frontend, ingress
├── docker-compose.yml          # full local stack
└── .github/workflows/ci.yml    # CI: build + test backend, build frontend
```

---

## Running locally

Prerequisites: **JDK 21**, **Node 20+**, **Docker + Docker Compose**
(optionally local PostgreSQL / MongoDB / Redis / Kafka).

### Option A — Full stack with Docker Compose (recommended)

Start every service (Postgres, Mongo, Redis, Zookeeper, Kafka, backend,
frontend):

```bash
docker compose up --build
```

- Frontend: http://localhost
- Backend / Swagger UI: http://localhost:8080/swagger-ui.html
- Actuator health: http://localhost:8080/actuator/health

Flyway migrates PostgreSQL on backend startup and the app seeds the default
admin and departments automatically.

### Option B — Backend(s) on Docker, code on the host

```bash
docker compose up -d postgres mongo redis zookeeper kafka
```

Then run the Spring Boot app from your IDE or:

```bash
cd backend
./mvnw spring-boot:run       # Windows: mvnw.cmd spring-boot:run
```

### Option C — Everything on the host

1. Start PostgreSQL, MongoDB, Redis and Kafka locally (defaults in the
   `default` profile target `localhost`).
2. Create the `civicissue` database in PostgreSQL.
3. `cd backend && ./mvnw spring-boot:run`
4. `cd frontend && npm install && npm run dev` → http://localhost:5173
   (Vite proxies `/api` and `/uploads` to `http://localhost:8080`).

### Default credentials

| Role    | Email                    | Password      |
|---------|--------------------------|---------------|
| Admin   | admin@civicissue.com     | admin123      |
| Citizen | (seeded sample accounts) | (see seed)    |

### Running the tests

```bash
cd backend
./mvnw test          # Windows: mvnw.cmd test
```

The `test` profile uses H2 (with Flyway disabled) and in-memory
MongoDB/Redis/Kafka stubs, so the whole suite runs without external services.

---

## REST API overview

All responses use the `ApiResponse { success, message, data, timestamp }`
envelope; the frontend client unwraps `.data` automatically.

| Method | Path                                      | Auth  | Description                          |
|--------|-------------------------------------------|-------|--------------------------------------|
| POST   | `/api/auth/register`                      | –     | Register                             |
| POST   | `/api/auth/login`                         | –     | Login → JWT                          |
| GET    | `/api/auth/me`                            | JWT   | Current user                         |
| POST   | `/api/issues` (multipart)                 | CITIZEN | Create issue (request + image)     |
| GET    | `/api/issues/my`                          | JWT   | My issues (filter by status)         |
| GET    | `/api/issues/{id}`                        | JWT   | Issue detail                         |
| GET    | `/api/issues/nearby`                      | JWT   | Issues near lat/lon within radius    |
| GET/POST/DELETE | `/api/issues/{id}/comments` (…`/{commentId}`) | JWT | Comments                |
| GET    | `/api/admin/issues`                       | ADMIN | Search/filter all issues             |
| PATCH  | `/api/admin/issues/{id}/status`           | ADMIN | Update status                        |
| PATCH  | `/api/admin/issues/{id}/priority`         | ADMIN | Update priority                      |
| POST   | `/api/admin/issues/{id}/assign`           | ADMIN | Assign issue to department           |
| GET    | `/api/admin/dashboard`                    | ADMIN | Aggregate stats                      |
| GET    | `/api/admin/users`                        | ADMIN | List users                           |
| PATCH  | `/api/admin/users/{id}/role`              | ADMIN | Change role                          |
| CRUD   | `/api/departments`                        | ADMIN | Department management                |
| GET    | `/api/notifications`                      | JWT   | My notifications                     |
| GET    | `/api/notifications/unread-count`         | JWT   | Unread count                         |
| PATCH  | `/api/notifications/{id}/read`, `/read-all` | JWT | Mark read                          |
| GET    | `/actuator/health`                        | –     | Health check                         |

Interactive docs: http://localhost:8080/swagger-ui.html
JSON spec: http://localhost:8080/api-docs

---

## Docker Compose services

| Service    | Image / build          | Port(s)      |
|------------|------------------------|--------------|
| postgres   | `postgres:16-alpine`   | 5432         |
| mongo      | `mongo:7`              | 27017        |
| redis      | `redis:7-alpine`       | 6379         |
| zookeeper  | `cp-zookeeper:7.5`     | 2181         |
| kafka      | `cp-kafka:7.5`         | 9092/29092   |
| backend    | `./backend`            | 8080         |
| frontend   | `./frontend` (nginx)   | 80           |

Volumes persist Postgres, Mongo, Redis, Zookeeper and Kafka data. Uploaded
images are mounted from `./backend/uploads`. The frontend nginx proxies
`/api` and `/uploads` to `backend:8080` (override via `API_PROXY_PASS`).

---

## Kubernetes

Manifests live in `k8s/` and provide a ConfigMap, Secrets, StatefulSets/
Deployments for Postgres, MongoDB, Redis, Zookeeper, Kafka, and Deployments +
an Ingress for the backend and frontend:

```bash
kubectl apply -f k8s/
```

The backend ConfigMap sets `kafka:9092` for the in-cluster Kafka broker, and
the Ingress routes `/api` and `/uploads` to the backend and `/` to the
frontend. Set the JWT secret via the `Secret` object before deploying.

---

## CI/CD

`.github/workflows/ci.yml` runs on push/PR:

- `./mvnw -B -f backend/pom.xml verify` — compile + all backend tests
- Frontend `npm ci && npm run build` — production bundle + lint

---

## Configuration

| Env var                              | Profile    | Description                        | Default |
|--------------------------------------|------------|------------------------------------|---------|
| `JWT_SECRET`                         | all        | 256-bit HMAC signing key          | dev default in `application.yml` |
| `JWT_EXPIRATION`                     | all        | Token TTL (ms)                    | `86400000` |
| `UPLOAD_DIR`                         | all        | Directory for uploaded images     | `uploads` |
| `SPRING_PROFILES_ACTIVE`             | all        | `default` \| `docker` \| `test`   | `default` |
| `SPRING_DATASOURCE_URL/USERNAME/PASSWORD` | docker | PostgreSQL connection       | compose-provided |
| `SPRING_DATA_MONGODB_URI`            | docker     | Mongo connection                  | compose-provided |
| `SPRING_KAFKA_BOOTSTRAP_SERVERS`     | docker     | Kafka broker                       | `kafka:29092` (compose) / `kafka:9092` (k8s) |
| `VITE_API_URL`                       | frontend   | Absolute API base (prod build)    | `/` (relative) |
| `API_PROXY_PASS`                     | frontend   | Backend origin for nginx proxy    | `http://backend:8080` |

> **Security**: never rely on the default `JWT_SECRET` in a real deployment —
> always set a strong, unique value via environment variable or the k8s Secret.

---

## Notes / limitations

- **Notifications** are delivered in-app (MongoDB + Kafka + Redis). The
  original prototype's **WhatsApp Cloud API** integration
  (`whatsapp_service.py`) was not ported to the Java backend; it remains a
  natural extension point behind the notification service.
- **Uploaded images** are stored on the local filesystem; for multi-replica /
  cloud deployments switch `FileStorageService` to an object store (S3/GCS).
- Swagger is disabled under the `test` profile.
