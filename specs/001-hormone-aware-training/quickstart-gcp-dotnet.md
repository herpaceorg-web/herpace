# Quickstart Guide - HerPace (.NET 8 + Google Cloud + Gemini AI)

**Stack**: Blazor WebAssembly, ASP.NET Core Web API, Google Cloud Platform, Gemini 1.5 Pro
**Target**: Google AI Hackathon qualification with model flexibility

---

## Prerequisites

- .NET 8.0 SDK: https://dotnet.microsoft.com/download
- Google Cloud SDK: https://cloud.google.com/sdk/docs/install
- Docker Desktop (for Cloud Run local testing)
- Visual Studio 2022 or VS Code with C# Dev Kit
- PostgreSQL 15+ (local) or Google Cloud SQL

---

## Google Cloud Setup

### 1. Create GCP Project

```bash
# Login to Google Cloud
gcloud auth login

# Create project
gcloud projects create herpace-dev --name="HerPace MVP"
gcloud config set project herpace-dev

# Enable required APIs
gcloud services enable \
  run.googleapis.com \
  sqladmin.googleapis.com \
  aiplatform.googleapis.com \
  cloudbuild.googleapis.com \
  secretmanager.googleapis.com

# Enable billing (required for Vertex AI)
# Visit: https://console.cloud.google.com/billing
```

### 2. Create Cloud SQL Instance

```bash
# Create PostgreSQL instance
gcloud sql instances create herpace-db \
  --database-version=POSTGRES_15 \
  --tier=db-f1-micro \
  --region=us-central1

# Create database
gcloud sql databases create herpacedb --instance=herpace-db

# Create user
gcloud sql users create herpaceuser \
  --instance=herpace-db \
  --password=<STRONG_PASSWORD>

# Get connection name (for connection string)
gcloud sql instances describe herpace-db --format="value(connectionName)"
# Output: herpace-dev:us-central1:herpace-db
```

### 3. Enable Vertex AI (Gemini)

```bash
# Vertex AI is enabled automatically when aiplatform API is enabled
# Test access to Gemini 1.5 Pro
gcloud ai models list --region=us-central1 --filter="displayName:gemini-1.5-pro"
```

---

## Backend Setup (.NET 8 API)

### 1. Create Solution Structure

```bash
mkdir HerPaceApp
cd HerPaceApp

# Create solution
dotnet new sln -n HerPace

# Create projects
dotnet new webapi -n HerPace.API -o backend/src/HerPace.API
dotnet new classlib -n HerPace.Core -o backend/src/HerPace.Core
dotnet new classlib -n HerPace.Infrastructure -o backend/src/HerPace.Infrastructure
dotnet new xunit -n HerPace.Tests -o backend/src/HerPace.Tests

# Add projects to solution
dotnet sln add backend/src/HerPace.API/HerPace.API.csproj
dotnet sln add backend/src/HerPace.Core/HerPace.Core.csproj
dotnet sln add backend/src/HerPace.Infrastructure/HerPace.Infrastructure.csproj
dotnet sln add backend/src/HerPace.Tests/HerPace.Tests.csproj

# Add project references
cd backend/src/HerPace.API
dotnet add reference ../HerPace.Core/HerPace.Core.csproj
dotnet add reference ../HerPace.Infrastructure/HerPace.Infrastructure.csproj

cd ../HerPace.Infrastructure
dotnet add reference ../HerPace.Core/HerPace.Core.csproj

cd ../HerPace.Tests
dotnet add reference ../HerPace.API/HerPace.API.csproj
dotnet add reference ../HerPace.Core/HerPace.Core.csproj
```

### 2. Install NuGet Packages

```bash
cd backend/src/HerPace.API
dotnet add package Microsoft.AspNetCore.Identity.EntityFrameworkCore
dotnet add package Microsoft.AspNetCore.Authentication.JwtBearer
dotnet add package Npgsql.EntityFrameworkCore.PostgreSQL

cd ../HerPace.Infrastructure
dotnet add package Microsoft.EntityFrameworkCore
dotnet add package Npgsql.EntityFrameworkCore.PostgreSQL
dotnet add package Google.Cloud.AIPlatform.V1
dotnet add package Microsoft.EntityFrameworkCore.Design

cd ../HerPace.Tests
dotnet add package Moq
dotnet add package FluentAssertions
```

### 3. Configure EF Core + Cloud SQL

**HerPace.Infrastructure/Data/HerPaceDbContext.cs**:
```csharp
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using HerPace.Core.Entities;

namespace HerPace.Infrastructure.Data;

public class HerPaceDbContext : IdentityDbContext<User, IdentityRole<Guid>, Guid>
{
    public HerPaceDbContext(DbContextOptions<HerPaceDbContext> options) : base(options) { }

    public DbSet<Runner> Runners => Set<Runner>();
    public DbSet<Race> Races => Set<Race>();
    public DbSet<TrainingPlan> TrainingPlans => Set<TrainingPlan>();
    public DbSet<TrainingSession> TrainingSessions => Set<TrainingSession>();
    public DbSet<CycleLog> CycleLogs => Set<CycleLog>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Single active plan constraint (FR-017)
        modelBuilder.Entity<TrainingPlan>()
            .HasIndex(p => new { p.RunnerId, p.Status })
            .IsUnique()
            .HasFilter("\"Status\" = 'Active'");

        // See data-model.md for full schema configuration
    }
}
```

**HerPace.API/appsettings.Development.json**:
```json
{
  "ConnectionStrings": {
    "HerPaceDb": "Host=localhost;Database=herpacedb;Username=herpaceuser;Password=<PASSWORD>"
  },
  "Jwt": {
    "Secret": "<GENERATE_RANDOM_SECRET_32_CHARS>",
    "ExpiryMinutes": 60
  },
  "AI": {
    "Provider": "Gemini",
    "GCP": {
      "ProjectId": "herpace-dev",
      "Location": "us-central1"
    }
  }
}
```

### 4. Implement Gemini AI Service

**HerPace.Core/Interfaces/IAIPlanGenerator.cs**:
```csharp
namespace HerPace.Core.Interfaces;

public interface IAIPlanGenerator
{
    Task<GeneratedPlanDto> GeneratePlanAsync(
        Runner runner,
        Race race,
        List<CyclePhaseDto> predictedPhases,
        CancellationToken cancellationToken = default);
}
```

**HerPace.Infrastructure/AI/GeminiPlanGenerator.cs** (see research.md Section 7 for full implementation)

### 5. Run Migrations

```bash
cd backend/src/HerPace.Infrastructure
dotnet ef migrations add InitialCreate --startup-project ../HerPace.API
dotnet ef database update --startup-project ../HerPace.API
```

---

## Frontend Setup (Blazor WebAssembly)

### 1. Create Blazor WASM Project

```bash
cd HerPaceApp
dotnet new blazorwasm -n HerPace.Client -o frontend/HerPace.Client
dotnet sln add frontend/HerPace.Client/HerPace.Client.csproj

cd frontend/HerPace.Client
dotnet add package MudBlazor
dotnet add package Microsoft.AspNetCore.Components.WebAssembly.Authentication
```

### 2. Configure MudBlazor (Accessible UI)

**wwwroot/index.html**:
```html
<link href="https://fonts.googleapis.com/css?family=Roboto:300,400,500,700&display=swap" rel="stylesheet" />
<link href="_content/MudBlazor/MudBlazor.min.css" rel="stylesheet" />

<script src="_content/MudBlazor/MudBlazor.min.js"></script>
```

**Program.cs**:
```csharp
using MudBlazor.Services;

builder.Services.AddMudServices();
```

### 3. Sample Accessible Component

**Components/SessionCard.razor**:
```razor
@using MudBlazor

<MudCard>
    <MudCardHeader>
        <MudText Typo="Typo.h5" id="workout-title">@Session.WorkoutType Workout</MudText>
        @if (Session.CyclePhase != null)
        {
            <MudChip Color="Color.Secondary" aria-label="Cycle phase: @Session.CyclePhase">
                @Session.CyclePhase Phase
            </MudChip>
        }
    </MudCardHeader>
    <MudCardContent>
        <MudText>Duration: @Session.DurationMinutes min</MudText>
        <MudText>Distance: @Session.Distance km</MudText>
        @if (!string.IsNullOrEmpty(Session.PhaseGuidance))
        {
            <MudAlert Severity="Severity.Info" Dense="true">@Session.PhaseGuidance</MudAlert>
        }
    </MudCardContent>
    <MudCardActions>
        <MudButton Variant="Variant.Filled" Color="Color.Success"
                   OnClick="() => OnComplete.InvokeAsync()"
                   AriaLabel="Mark workout as complete">
            Complete
        </MudButton>
        <MudButton Variant="Variant.Outlined" Color="Color.Primary"
                   OnClick="() => OnModify.InvokeAsync()">
            Modify
        </MudButton>
        <MudButton Variant="Variant.Text"
                   OnClick="() => OnSkip.InvokeAsync()">
            Skip
        </MudButton>
    </MudCardActions>
</MudCard>

@code {
    [Parameter] public TrainingSessionDto Session { get; set; } = null!;
    [Parameter] public EventCallback OnComplete { get; set; }
    [Parameter] public EventCallback OnModify { get; set; }
    [Parameter] public EventCallback OnSkip { get; set; }
}
```

---

## Local Development

### Run Backend API
```bash
cd backend/src/HerPace.API
dotnet run
# API: https://localhost:7001
```

### Run Blazor Frontend
```bash
cd frontend/HerPace.Client
dotnet run
# UI: https://localhost:7002
```

---

## Deployment to Google Cloud

### 1. Containerize Backend

**backend/src/HerPace.API/Dockerfile**:
```dockerfile
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
WORKDIR /app
EXPOSE 8080

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY ["HerPace.API/HerPace.API.csproj", "HerPace.API/"]
COPY ["HerPace.Core/HerPace.Core.csproj", "HerPace.Core/"]
COPY ["HerPace.Infrastructure/HerPace.Infrastructure.csproj", "HerPace.Infrastructure/"]
RUN dotnet restore "HerPace.API/HerPace.API.csproj"
COPY . .
WORKDIR "/src/HerPace.API"
RUN dotnet build "HerPace.API.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "HerPace.API.csproj" -c Release -o /app/publish

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "HerPace.API.dll"]
```

### 2. Deploy to Cloud Run

```bash
cd backend/src
gcloud builds submit --tag gcr.io/herpace-dev/herpace-api

gcloud run deploy herpace-api \
  --image gcr.io/herpace-dev/herpace-api \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --add-cloudsql-instances herpace-dev:us-central1:herpace-db \
  --set-env-vars "ConnectionStrings__HerPaceDb=Host=/cloudsql/herpace-dev:us-central1:herpace-db;Database=herpacedb;Username=herpaceuser;Password=<PASSWORD>"
```

### 3. Deploy Blazor WASM (Static Hosting)

```bash
cd frontend/HerPace.Client
dotnet publish -c Release -o publish

gsutil mb gs://herpace-app-frontend
gsutil -m cp -r publish/wwwroot/* gs://herpace-app-frontend/
gsutil web set -m index.html gs://herpace-app-frontend

# Make bucket public
gsutil iam ch allUsers:objectViewer gs://herpace-app-frontend
```

---

## Accessibility Checklist (WCAG 2.1 AA - Constitution Requirement)

MudBlazor provides accessibility out-of-box, but verify:

- ✅ **Semantic HTML**: MudBlazor components render `<button>`, `<nav>`, `<form>` by default
- ✅ **Keyboard Navigation**: Tab through all interactive elements
- ✅ **ARIA Labels**: Add `AriaLabel` to icon-only buttons
- ✅ **Color Contrast**: MudBlazor default theme meets 4.5:1 minimum
- ✅ **Focus Indicators**: Visible by default (customize via theme if needed)
- ✅ **Screen Reader Test**: Test with NVDA/JAWS (Windows) or VoiceOver (Mac)

**Automated Testing**:
```bash
dotnet add package Playwright
# Run Playwright + axe-core (see research.md Section 8)
```

---

## Testing

```bash
# Unit tests
cd backend/src/HerPace.Tests
dotnet test

# Coverage report
dotnet test /p:CollectCoverage=true /p:CoverletOutputFormat=opencover
```

---

## Cost Estimate (Hackathon/MVP)

Using Google Cloud free tier + $300 credit:
- Cloud Run: ~$8/month (covered by free tier)
- Cloud SQL: ~$15/month
- Vertex AI (Gemini): ~$62/month (covered by $300 credit during hackathon)
- **Total**: ~$23/month after credits expire

---

## Key Differences from Previous Plan (Node/TypeScript)

| Aspect | Previous (Node.js/TypeScript) | Current (.NET/GCP) |
|--------|-------------------------------|---------------------|
| **Backend** | Express, Node.js 20 | ASP.NET Core Web API, .NET 8 |
| **Frontend** | Next.js 14 (React) | Blazor WebAssembly |
| **Language** | TypeScript (frontend + backend) | C# (full stack) |
| **ORM** | Prisma | Entity Framework Core 8 |
| **AI SDK** | Anthropic SDK (Claude) | Google.Cloud.AIPlatform.V1 (Gemini) |
| **AI Model** | Claude 3.5 Sonnet | **Gemini 1.5 Pro (HACKATHON)** |
| **Hosting** | Vercel + Railway | **Google Cloud Run + Cloud SQL** |
| **UI Library** | Tailwind + Radix UI | **MudBlazor** |
| **Testing** | Jest, React Testing Library | xUnit, bUnit, Playwright |
| **Cost (MVP)** | ~$127/month | ~$86/month |

---

## Next Steps

1. ✅ Review research.md for detailed technology decisions
2. ⬜ Set up Google Cloud project + enable APIs
3. ⬜ Initialize .NET solution structure
4. ⬜ Implement IAIPlanGenerator interface with Gemini
5. ⬜ Build Blazor components with MudBlazor
6. ⬜ Deploy to Cloud Run for hackathon demo
7. ⬜ Run `/speckit.tasks` to generate implementation task breakdown

**Hackathon Qualification**: ✅ Gemini 1.5 Pro integrated via Vertex AI
