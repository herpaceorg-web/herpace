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
- `GET|POST /api/profiles/me` - Runner profiles
- `GET|POST /api/races`, `GET|PUT /api/races/{id}` - Race management
- `POST /api/plans`, `GET /api/plans/active` - Training plans

## Configuration

Development settings in `appsettings.json`. Key configs:
- `ConnectionStrings:HerPaceDb` - PostgreSQL connection
- `Jwt:Secret`, `Jwt:Issuer`, `Jwt:Audience` - JWT auth
- `Gemini:ApiKey`, `Gemini:Model` - AI integration

**Production Configuration (`appsettings.Production.json`):**
- Do NOT put secrets (passwords, API keys) in this file - they will override environment variables
- Secrets are injected via Google Cloud Secret Manager at runtime
- Only put non-sensitive config values here

## Deployment

### Quick Update (after code changes)
```powershell
.\deploy-update.ps1
```

### Full Deployment (first time or infrastructure changes)
```powershell
.\deploy-complete.ps1
```

### Manual Deployment Commands

**Backend:**
```powershell
# Build and push using Cloud Build (recommended - avoids local Docker issues)
cd backend
gcloud builds submit --tag us-central1-docker.pkg.dev/herpace-mvp-app/herpace-repo/herpace-api:latest .

# Deploy to Cloud Run
gcloud run services update herpace-api --image=us-central1-docker.pkg.dev/herpace-mvp-app/herpace-repo/herpace-api:latest --region=us-central1
```

**Frontend:**
```powershell
# Build
cd frontend/src/HerPace.Client
dotnet publish -c Release

# Build and push Docker image using Cloud Build
cd frontend
gcloud builds submit --tag us-central1-docker.pkg.dev/herpace-mvp-app/herpace-repo/herpace-frontend:latest .

# Deploy to Cloud Run
gcloud run services update herpace-frontend --image=us-central1-docker.pkg.dev/herpace-mvp-app/herpace-repo/herpace-frontend:latest --region=us-central1
```

### Production URLs
- API: `https://herpace-api-81066941589.us-central1.run.app`
- Frontend: `https://herpace-frontend-81066941589.us-central1.run.app`

### Google Cloud Secrets
Secrets are stored in Secret Manager and injected as environment variables:
- `jwt-secret` → `Jwt__Secret`
- `db-connection` → `ConnectionStrings__HerPaceDb` AND `ConnectionStrings__CloudSqlConnection`
- `gemini-api-key` → `Gemini__ApiKey`

### Troubleshooting
- **500 errors on login:** Check Cloud Run logs: `gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=herpace-api AND severity>=ERROR" --limit=10 --format=json`
- **Database connection errors:** Ensure both `ConnectionStrings__HerPaceDb` AND `ConnectionStrings__CloudSqlConnection` are set (app uses `CloudSqlConnection` when `UseCloudSql=true`)
- **Old frontend code:** Frontend is served from Cloud Run, not Cloud Storage. Redeploy with `gcloud run services update herpace-frontend`
