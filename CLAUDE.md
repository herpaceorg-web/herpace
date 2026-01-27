# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

HerPaceApp is a hormone-aware training plan application for women runners. It generates AI-powered training plans that adapt to menstrual cycle phases using Google Gemini.

## Tech Stack

- **Backend:** C# 12, .NET 8.0, ASP.NET Core Web API, Entity Framework Core 8
- **Frontend:** Blazor WebAssembly (.NET 8.0), MudBlazor
- **Database:** PostgreSQL 15+ (Google Cloud SQL in production)
- **AI:** Google Gemini API
- **Auth:** ASP.NET Core Identity with JWT tokens
- **Deployment:** Docker + Google Cloud Run

## Build Commands

```bash
# Build entire solution
dotnet build HerPace.sln

# Run backend API (port 7001)
dotnet run --project backend/src/HerPace.API

# Run frontend (port 5163)
dotnet run --project frontend/src/HerPace.Client

# Run tests
dotnet test HerPace.sln

# Run single test
dotnet test --filter "FullyQualifiedName~TestName"
```

## Database Migrations (EF Core)

```bash
# Apply migrations
dotnet ef database update --project backend/src/HerPace.Infrastructure --startup-project backend/src/HerPace.API

# Create new migration
dotnet ef migrations add MigrationName --project backend/src/HerPace.Infrastructure --startup-project backend/src/HerPace.API
```

## Architecture

```
backend/
├── src/
│   ├── HerPace.API/           # Controllers, middleware, Program.cs (DI setup)
│   ├── HerPace.Core/          # Domain entities, DTOs, interfaces, enums
│   └── HerPace.Infrastructure/ # DbContext, services, AI integration, migrations
└── tests/HerPace.Tests/       # xUnit tests

frontend/
└── src/HerPace.Client/        # Blazor WASM pages, components, ApiClient service
```

**Layered Architecture:**
- API layer handles HTTP routing to services
- Core defines contracts and domain models
- Infrastructure implements services and data access
- Frontend consumes API via `Services/ApiClient.cs`

## Key Domain Concepts

**Cycle Phase Calculation** (`CyclePhaseCalculator.cs`): Scales standard 28-day cycle to variable lengths.
- Phases: Menstrual → Follicular → Ovulatory → Luteal
- Used to adjust training intensity during sensitive phases

**AI Plan Generation** (`HerPace.Infrastructure/AI/`):
- `GeminiPlanGenerator.cs` - Primary (Google Gemini)
- `FallbackPlanGenerator.cs` - Used when Gemini unavailable

**Entity Relationships:**
```
User (1) → (1) Runner → (∞) Race
                      → (∞) TrainingPlan → (∞) TrainingSession
```

## API Endpoints

- `POST /api/auth/signup`, `/api/auth/login` - Authentication
- `GET|PUT /api/profile`, `POST /api/profile/runner` - User/Runner profiles
- `GET|POST /api/race`, `GET|PUT /api/race/{id}` - Race management
- `POST /api/plan/generate`, `GET /api/plan`, `GET|PUT /api/plan/{id}` - Training plans

## Configuration

Development settings in `appsettings.json`. Key configs:
- `ConnectionStrings:HerPaceDb` - PostgreSQL connection
- `Jwt:Secret`, `Jwt:Issuer`, `Jwt:Audience` - JWT auth
- `Gemini:ApiKey`, `Gemini:Model` - AI integration

## Deployment

```powershell
# Full GCP deployment (Windows PowerShell)
.\deploy-complete.ps1

# Update existing deployment
.\deploy-update.ps1
```

Production URLs:
- API: `https://herpace-api-81066941589.us-central1.run.app`
- Frontend: `https://herpace-frontend-81066941589.us-central1.run.app`
