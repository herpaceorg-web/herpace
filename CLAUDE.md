# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

HerPaceApp is a hormone-aware training plan application for women runners. It generates AI-powered training plans that adapt to menstrual cycle phases using Google Gemini.

## Tech Stack

- **Backend:** C# 12, .NET 8.0, ASP.NET Core Web API, Entity Framework Core 8
- **Frontend:** React 19 + TypeScript, Vite, shadcn/ui + Tailwind CSS
- **Database:** PostgreSQL 15+ (Google Cloud SQL in production)
- **AI:** Google Gemini API
- **Auth:** ASP.NET Core Identity with JWT tokens
- **Deployment:** Docker + Google Cloud Run

## Build Commands

**Backend:**
```bash
# Build entire solution
dotnet build HerPace.sln

# Run backend API (port 7001)
dotnet run --project backend/src/HerPace.API

# Run tests
dotnet test HerPace.sln

# Run single test
dotnet test --filter "FullyQualifiedName~TestName"
```

**Frontend:**
```bash
cd frontend

# Install dependencies
npm install

# Run dev server (port 5163)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
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
└── src/
    ├── pages/                 # React page components (Login, Signup, Dashboard, etc.)
    ├── components/            # Reusable UI components (shadcn/ui)
    ├── lib/                   # Utilities (api-client.ts, auth.ts)
    ├── contexts/              # React contexts (AuthContext, etc.)
    ├── hooks/                 # Custom React hooks
    ├── schemas/               # Zod validation schemas
    ├── types/                 # TypeScript type definitions
    └── utils/                 # Helper functions
```

**Layered Architecture:**
- API layer handles HTTP routing to services
- Core defines contracts and domain models
- Infrastructure implements services and data access
- Frontend is a React SPA that consumes API via `lib/api-client.ts` (axios-based)

**Frontend Features:**
- React Router for client-side routing
- AuthContext for authentication state management
- ProtectedRoute component for route guards
- React Hook Form + Zod for form validation
- shadcn/ui components (built on Radix UI primitives)
- Tailwind CSS for styling
- Axios for HTTP requests with JWT token handling

**Key Pages:**
- `/login` - User login
- `/signup` - New user registration
- `/onboarding` - Profile setup after signup
- `/dashboard` - Main app dashboard (protected)
- `/privacy`, `/terms` - Legal pages

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

**Backend:**

Development settings in `appsettings.json`. Key configs:
- `ConnectionStrings:HerPaceDb` - PostgreSQL connection
- `Jwt:Secret`, `Jwt:Issuer`, `Jwt:Audience` - JWT auth
- `Gemini:ApiKey`, `Gemini:Model` - AI integration

**Production Configuration (`appsettings.Production.json`):**
- Do NOT put secrets (passwords, API keys) in this file - they will override environment variables
- Secrets are injected via Google Cloud Secret Manager at runtime
- Only put non-sensitive config values here

**Frontend:**

Environment variables for Vite (prefixed with `VITE_`):
- `.env.development` - Local development (API at `https://localhost:7001`)
- `.env.production` - Production build (API at Cloud Run URL)
- `VITE_API_BASE_URL` - Base URL for API calls (used by `lib/api-client.ts`)

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
gcloud builds submit --tag us-central1-docker.pkg.dev/project-1a640bec-d526-495e-b87/herpace-repo/herpace-api:latest .

# Deploy to Cloud Run
gcloud run services update herpace-api --image=us-central1-docker.pkg.dev/project-1a640bec-d526-495e-b87/herpace-repo/herpace-api:latest --region=us-central1
```

**Frontend:**
```powershell
# Build and push Docker image using Cloud Build
cd frontend
gcloud builds submit --tag us-central1-docker.pkg.dev/project-1a640bec-d526-495e-b87/herpace-repo/herpace-frontend:latest .

# Deploy to Cloud Run
gcloud run services update herpace-frontend --image=us-central1-docker.pkg.dev/project-1a640bec-d526-495e-b87/herpace-repo/herpace-frontend:latest --region=us-central1

# Note: The Dockerfile uses multi-stage build:
# - Stage 1: Node.js build (npm run build)
# - Stage 2: nginx serves static files from /usr/share/nginx/html
```

### Production URLs
- API: `https://herpace-api-330702404265.us-central1.run.app`
- Frontend: `https://herpace-frontend-330702404265.us-central1.run.app`

### Google Cloud Secrets
Secrets are stored in Secret Manager and injected as environment variables:
- `jwt-secret` → `Jwt__Secret`
- `db-connection` → `ConnectionStrings__HerPaceDb` AND `ConnectionStrings__CloudSqlConnection`
- `gemini-api-key` → `Gemini__ApiKey`

### Troubleshooting
- **500 errors on login:** Check Cloud Run logs: `gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=herpace-api AND severity>=ERROR" --limit=10 --format=json`
- **Database connection errors:** Ensure both `ConnectionStrings__HerPaceDb` AND `ConnectionStrings__CloudSqlConnection` are set (app uses `CloudSqlConnection` when `UseCloudSql=true`)
- **Old frontend code:** Frontend is served from Cloud Run, not Cloud Storage. Redeploy with `gcloud run services update herpace-frontend`
