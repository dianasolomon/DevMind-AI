# Spring Boot Backend — DevMind AI

## Overview
Spring Boot REST API backend for the DevMind AI codebase understanding assistant.

**Port:** `localhost:8080`

## Tech Stack
- Java 21 + Spring Boot 3.3
- Spring Data JPA (H2 for dev, PostgreSQL for integration)
- Maven (via wrapper — no install needed)

## Setup & Run

### Prerequisites
- Java 21+ installed (check: `java --version`)
- No Maven install needed — use the wrapper

### Start the server
```bash
# Windows
.\mvnw.cmd spring-boot:run

# Linux/Mac
./mvnw spring-boot:run
```

The server starts at **http://localhost:8080**

### H2 Console (dev only)
Open **http://localhost:8080/h2-console**
- JDBC URL: `jdbc:h2:mem:devminddb`
- Username: `sa`
- Password: *(leave blank)*

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| POST | `/api/projects/upload` | Upload ZIP codebase |
| GET | `/api/projects` | List all projects |
| GET | `/api/projects/{id}` | Get project details |
| DELETE | `/api/projects/{id}` | Delete project |
| POST | `/api/projects/{id}/chat` | Ask AI about the project |
| GET | `/api/projects/{id}/files` | List project files |

## Upload a Project (example)
```bash
curl -X POST http://localhost:8080/api/projects/upload \
  -F "file=@myproject.zip"
```

## Ask a Question (example)
```bash
curl -X POST http://localhost:8080/api/projects/{projectId}/chat \
  -H "Content-Type: application/json" \
  -d '{"question": "What does the AuthService class do?"}'
```

## Run Tests
```bash
.\mvnw.cmd test
```

## Switch to PostgreSQL (when Member 5 is ready)
1. Open `src/main/resources/application.properties`
2. Comment out the H2 block
3. Uncomment the PostgreSQL block
4. Make sure PostgreSQL is running on port 5432

## Project Structure
```
springboot-backend/
├── pom.xml
├── src/
│   └── main/
│       ├── java/com/devmind/backend/
│       │   ├── DevMindApplication.java    ← Entry point
│       │   ├── controller/
│       │   │   ├── ProjectController.java ← Upload, CRUD, file list
│       │   │   ├── ChatController.java    ← AI chat proxy
│       │   │   └── HealthController.java  ← Health check
│       │   ├── service/
│       │   │   ├── ProjectService.java    ← Business logic
│       │   │   ├── ZipExtractorService.java ← ZIP handling
│       │   │   └── FastApiClient.java     ← HTTP to FastAPI
│       │   ├── model/
│       │   │   └── Project.java           ← JPA entity
│       │   ├── repository/
│       │   │   └── ProjectRepository.java
│       │   ├── dto/
│       │   │   ├── ProjectDTO.java
│       │   │   ├── ChatRequest.java
│       │   │   ├── ChatResponse.java
│       │   │   └── FileEntryDTO.java
│       │   └── config/
│       │       ├── CorsConfig.java        ← CORS for Next.js
│       │       └── GlobalExceptionHandler.java
│       └── resources/
│           └── application.properties
```
