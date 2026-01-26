# Phase 0: Research - Hormone-Aware Training Plan System (Google Cloud + .NET Stack)

**Date**: 2026-01-25
**Purpose**: Resolve technical unknowns and establish best practices for GCP + .NET + Gemini AI implementation

## Research Areas

This document resolves all "NEEDS CLARIFICATION" items from the Technical Context section of plan.md, with focus on Google Cloud Platform, .NET 8, and Gemini AI integration for hackathon qualification.

---

## 1. Frontend Framework Selection (.NET Ecosystem)

### Decision: Blazor WebAssembly

**Rationale**:
- **C# Full Stack**: Share code, models, and validation logic between backend and frontend
- **WebAssembly Performance**: Runs client-side, no server round-trips for UI interactions
- **Component Model**: Similar to React/Vue, supports reusable accessible components
- **Blazor Bootstrap/MudBlazor**: Pre-built accessible UI component libraries (WCAG 2.1 AA compliant)
- **Gemini Hackathon Alignment**: .NET is Google Cloud compatible, official Google.Cloud.AIPlatform.V1 NuGet package
- **Type Safety**: No TypeScript needed, C# provides compile-time safety
- **SEO/SSR Option**: Can switch to Blazor Server or .NET 8 SSR if needed

**Alternatives Considered**:
- **React/Angular with .NET API**: More mature ecosystem, larger dev community, but loses C# full-stack benefits and requires TypeScript/JavaScript context switching. Rejected for hackathon speed (single language).
- **Blazor Server**: Real-time SignalR connection, but higher server load and latency for interactive UI. Rejected for scalability at 10k users.
- **ASP.NET MVC/Razor Pages**: Server-rendered, but not SPA experience. Rejected for modern UX requirements (SC-003: 3 taps from launch to workout).

**Version Selection**:
- .NET 8.0 (latest LTS, released Nov 2023)
- Blazor WebAssembly with .NET 8 improvements (enhanced performance, AOT compilation option)

---

## 2. Google Cloud Infrastructure & Services

### Decision: Cloud Run + Cloud SQL + Vertex AI (Gemini)

**Rationale**:
- **Cloud Run (Backend)**:
  - Fully managed serverless containers (no Kubernetes complexity)
  - Auto-scales 0→1000+ instances based on traffic (MVP→scale)
  - Supports .NET 8 via Docker containers
  - Pay-per-request pricing (cost-effective for MVP)
  - 99.95% SLA (meets SC-006: 99% uptime)
  - Integrated with Cloud SQL, Secret Manager

- **Cloud SQL for PostgreSQL**:
  - Managed PostgreSQL 15+ (same DB from previous plan)
  - Automated backups, point-in-time recovery (HIPAA compliance)
  - Private IP for secure backend connection
  - Vertical/horizontal scaling (read replicas for 10k+ users)
  - Compatible with Entity Framework Core

- **Vertex AI - Gemini 1.5 Pro** (HACKATHON REQUIREMENT):
  - Latest Google Gemini model (1.5 Pro: 1M token context, multimodal, fast)
  - Structured output support (JSON mode for training plan generation per FR-021)
  - Google Cloud native (no external API keys, IAM-based auth)
  - Cost: ~$3.50 per 1M input tokens, $10.50 per 1M output tokens (cheaper than GPT-4)
  - **Hackathon Qualification**: Using Gemini through Vertex AI qualifies for Google AI Hackathon

- **Cloud Storage**:
  - Future: Store training plan templates (fallback), user exports
  - HIPAA-compliant storage for health data backups

- **Cloud Build**:
  - CI/CD for containerizing .NET API and deploying to Cloud Run
  - GitHub integration for auto-deploy on merge to main

**Alternatives Considered**:
- **Google Kubernetes Engine (GKE)**: More control, but overkill for MVP. Deferred until scale requires multi-region, complex orchestration.
- **App Engine**: Simpler than Cloud Run, but less flexible for .NET containerization. Rejected for limited .NET 8 support.
- **Firebase (Firestore)**: Easier setup, but relational data (Training Plans → Sessions) better suited for Cloud SQL. Rejected.

**GCP Services Summary**:
| Service | Purpose | Cost (MVP - 1000 users) |
|---------|---------|-------------------------|
| Cloud Run | API hosting | ~$10/month (2M requests) |
| Cloud SQL (PostgreSQL) | Database | ~$25/month (db-f1-micro + storage) |
| Vertex AI (Gemini) | AI plan generation | ~$70/month (2000 plans × $0.035) |
| Cloud Storage | Backups, templates | ~$2/month (10GB) |
| **Total** | | **~$107/month** |

---

## 3. AI Abstraction Layer (Model Flexibility)

### Decision: Strategy Pattern with IAIPlanGenerator Interface

**Rationale**:
- **Hackathon Primary**: Gemini 1.5 Pro required for qualification
- **Future Flexibility**: Interface allows swapping to Claude, GPT-4, or custom models
- **Fallback Support**: Implements same interface for template-based plans (no AI)
- **Configuration-Driven**: appsettings.json controls which provider is active

**Architecture**:
```csharp
// Core/Interfaces/IAIPlanGenerator.cs
public interface IAIPlanGenerator
{
    Task<GeneratedPlanDto> GeneratePlanAsync(
        Runner runner,
        Race race,
        List<CyclePhase> predictedPhases,
        CancellationToken cancellationToken = default);
}

// Infrastructure/AI/GeminiPlanGenerator.cs (PRIMARY)
public class GeminiPlanGenerator : IAIPlanGenerator
{
    private readonly PredictionServiceClient _geminiClient;
    // Uses Google.Cloud.AIPlatform.V1 NuGet package
}

// Infrastructure/AI/ClaudePlanGenerator.cs (FUTURE)
public class ClaudePlanGenerator : IAIPlanGenerator
{
    // Anthropic SDK implementation (when needed)
}

// Infrastructure/AI/OpenAIPlanGenerator.cs (FUTURE)
public class OpenAIPlanGenerator : IAIPlanGenerator
{
    // OpenAI SDK implementation (when needed)
}

// Infrastructure/AI/FallbackPlanGenerator.cs
public class FallbackPlanGenerator : IAIPlanGenerator
{
    // Template-based generation (no external API)
}

// API/Program.cs - Dependency Injection
builder.Services.AddScoped<IAIPlanGenerator>(sp =>
{
    var provider = builder.Configuration["AI:Provider"]; // "Gemini" | "Claude" | "OpenAI" | "Fallback"
    return provider switch
    {
        "Gemini" => sp.GetRequiredService<GeminiPlanGenerator>(),
        "Claude" => sp.GetRequiredService<ClaudePlanGenerator>(),
        "OpenAI" => sp.GetRequiredService<OpenAIPlanGenerator>(),
        _ => sp.GetRequiredService<FallbackPlanGenerator>()
    };
});
```

**Alternatives Considered**:
- **Hard-coded Gemini only**: Fastest for hackathon, but violates user requirement "model flexibility". Rejected.
- **Plugin architecture with reflection**: Over-engineering for MVP. Deferred to post-hackathon if needed.

---

## 4. Entity Framework Core Data Access

### Decision: EF Core 8 with Code-First Migrations

**Rationale**:
- **ORM Standard**: Industry-standard .NET data access layer
- **Code-First**: Define entities in C#, generate database schema via migrations
- **PostgreSQL Provider**: Npgsql.EntityFrameworkCore.PostgreSQL (mature, well-supported)
- **LINQ Queries**: Type-safe queries vs raw SQL
- **Migration Versioning**: Track schema changes in source control
- **Cloud SQL Compatibility**: Works seamlessly with Google Cloud SQL for PostgreSQL

**Implementation Pattern**:
```csharp
// Infrastructure/Data/HerPaceDbContext.cs
public class HerPaceDbContext : DbContext
{
    public DbSet<User> Users { get; set; }
    public DbSet<Runner> Runners { get; set; }
    public DbSet<Race> Races { get; set; }
    public DbSet<TrainingPlan> TrainingPlans { get; set; }
    public DbSet<TrainingSession> TrainingSessions { get; set; }
    public DbSet<CycleLog> CycleLogs { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        // Single active plan constraint (FR-017)
        modelBuilder.Entity<TrainingPlan>()
            .HasIndex(p => new { p.RunnerId, p.Status })
            .IsUnique()
            .HasFilter("\"Status\" = 'Active'"); // PostgreSQL partial index

        // Other constraints from data-model.md
    }
}
```

**Migration Strategy**:
```bash
# Create migration
dotnet ef migrations add InitialCreate --project HerPace.Infrastructure

# Apply to Cloud SQL
dotnet ef database update --project HerPace.Infrastructure --connection "<Cloud SQL connection string>"
```

**Alternatives Considered**:
- **Dapper (Micro-ORM)**: Faster queries, but requires manual SQL and schema management. Rejected for slower MVP development.
- **Database-First**: Reverse-engineer existing DB. Not applicable (greenfield project).

---

## 5. Authentication & Authorization (.NET)

### Decision: ASP.NET Core Identity + JWT Tokens

**Rationale**:
- **Built-in**: ASP.NET Core Identity handles user management, password hashing (bcrypt), email confirmation
- **JWT Auth**: Stateless tokens for API authentication (works well with Blazor WebAssembly)
- **Google Cloud Integration**: Can add Google OAuth via Google.Apis.Auth NuGet
- **HIPAA Compliance**: Session logging via EF Core audit tables
- **Role-based Access**: Future admin roles if needed

**Implementation**:
```csharp
// Core/Entities/User.cs
public class User : IdentityUser<Guid>
{
    public DateTime CreatedAt { get; set; }
    public DateTime? DeletedAt { get; set; } // Soft delete for GDPR 30-day retention
    public Runner? Runner { get; set; }
}

// API/Program.cs
builder.Services.AddIdentity<User, IdentityRole<Guid>>()
    .AddEntityFrameworkStores<HerPaceDbContext>()
    .AddDefaultTokenProviders();

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Secret"])),
            ValidateIssuer = false,
            ValidateAudience = false
        };
    });
```

**Alternatives Considered**:
- **Google Identity Platform**: Managed auth service, but adds vendor lock-in beyond GCP infrastructure. Deferred for future.
- **Auth0/Okta**: External dependencies, costs. Rejected for MVP.

---

## 6. Blazor Accessibility & UI Components

### Decision: MudBlazor Component Library

**Rationale**:
- **WCAG 2.1 AA Compliant**: Built-in accessibility (keyboard navigation, ARIA labels, focus management)
- **Material Design**: Modern, responsive UI out-of-box (meets 360px mobile requirement)
- **Blazor-Native**: Written for Blazor, no JavaScript interop overhead
- **Components**: Buttons, Forms, Dialogs, Data Grids, Date Pickers (all needed for HerPace)
- **Customizable**: Theming system for brand colors
- **Active Community**: Well-maintained, good documentation

**Accessibility Features (Constitution Requirement)**:
- Semantic HTML rendered by default (`<button>`, `<nav>`, `<form>`)
- Keyboard navigation built-in (Tab, Arrow keys, Esc)
- ARIA attributes automatically added
- Focus indicators (customizable via theme)
- Color contrast: Default theme meets 4.5:1 minimum

**Example Component**:
```razor
@* MudBlazor button with accessibility built-in *@
<MudButton Variant="Variant.Filled"
           Color="Color.Primary"
           OnClick="CompleteWorkout"
           AriaLabel="Mark workout as complete">
    Complete Workout
</MudButton>

@* Renders as: *@
<button class="mud-button-root mud-button-filled mud-button-filled-primary"
        type="button"
        aria-label="Mark workout as complete"
        tabindex="0">
    Complete Workout
</button>
```

**Alternatives Considered**:
- **Blazorise**: Another Blazor component library, supports Bootstrap/Material/Bulma. Similar quality, but MudBlazor has better Material Design implementation. Deferred.
- **Custom Components**: Full control, but reinventing accessibility is risky (constitution violation). Rejected.
- **Radix UI**: React library, not compatible with Blazor. Not applicable.

---

## 7. Gemini API Integration (Vertex AI)

### Decision: Google.Cloud.AIPlatform.V1 NuGet Package + Structured Output

**Rationale**:
- **Official SDK**: Google's official .NET client for Vertex AI
- **Gemini 1.5 Pro Access**: Latest model with 1M token context window
- **Structured Output**: Supports JSON mode for training plan schema (FR-021 validation)
- **IAM Authentication**: Uses Google Cloud service account (no API keys in code)
- **Streaming Support**: Can stream plan generation for real-time feedback (future)
- **Cost-Effective**: $3.50 per 1M input tokens (vs GPT-4 Turbo at $10/1M)

**Implementation Example**:
```csharp
using Google.Cloud.AIPlatform.V1;

public class GeminiPlanGenerator : IAIPlanGenerator
{
    private readonly PredictionServiceClient _client;
    private readonly string _projectId;
    private readonly string _location;

    public async Task<GeneratedPlanDto> GeneratePlanAsync(
        Runner runner, Race race, List<CyclePhase> predictedPhases)
    {
        var endpoint = $"projects/{_projectId}/locations/{_location}/publishers/google/models/gemini-1.5-pro";

        var prompt = BuildPlanPrompt(runner, race, predictedPhases);

        var request = new PredictRequest
        {
            Endpoint = endpoint,
            Instances =
            {
                new Value
                {
                    StructValue = new Struct
                    {
                        Fields =
                        {
                            ["prompt"] = Value.ForString(prompt),
                            ["parameters"] = Value.ForStruct(new Struct
                            {
                                Fields =
                                {
                                    ["temperature"] = Value.ForNumber(0.2), // Consistent output
                                    ["maxOutputTokens"] = Value.ForNumber(4096),
                                    ["responseMimeType"] = Value.ForString("application/json") // JSON mode
                                }
                            })
                        }
                    }
                }
            }
        };

        var response = await _client.PredictAsync(request);
        var planJson = response.Predictions[0].StructValue.Fields["content"].StringValue;

        // Validate JSON schema (FR-021)
        return ValidateAndParsePlan(planJson);
    }

    private string BuildPlanPrompt(Runner runner, Race race, List<CyclePhase> phases)
    {
        return $@"
Create a personalized running training plan in JSON format.

**User Profile**:
- Fitness Level: {runner.FitnessLevel}
- Typical Weekly Mileage: {runner.TypicalWeeklyMileage ?? 0} {runner.DistanceUnit}
- Recent Race Time: {runner.RecentRaceTime ?? ""Not provided""}

**Race Goal**:
- Race: {race.RaceName}
- Date: {race.RaceDate:yyyy-MM-dd}
- Distance: {race.Distance} {runner.DistanceUnit}
- Goal Time: {race.GoalTime ?? ""Not specified""}

**Cycle Phases** (optimize workouts based on these):
{string.Join(""\n"", phases.Select(p => $""- {p.Date:yyyy-MM-dd}: {p.Phase}""))}

**Workout Types** (use ONLY these):
- Easy, Long, Tempo, Interval, Rest

**Cycle-Aware Guidelines**:
- Follicular (Days 6-13): High energy → Interval & Tempo
- Ovulatory (Days 14-15): Peak performance window
- Luteal (Days 16-28): Reduce intensity → More Easy runs
- Menstrual (Days 1-5): Recovery focus → Easy & Rest

**Response Format** (JSON):
{{
  ""planMetadata"": {{
    ""totalWeeks"": <number>,
    ""weeklyMileageRange"": ""<low>-<high> {runner.DistanceUnit}""
  }},
  ""sessions"": [
    {{
      ""scheduledDate"": ""YYYY-MM-DD"",
      ""workoutType"": ""Easy|Long|Tempo|Interval|Rest"",
      ""durationMinutes"": <number or null>,
      ""distance"": <number or null>,
      ""intensityLevel"": ""Low|Moderate|High"",
      ""cyclePhase"": ""Follicular|Ovulatory|Luteal|Menstrual"",
      ""phaseGuidance"": ""Brief tip for this workout""
    }}
  ]
}}

Generate the complete plan from today through race day.
";
    }
}
```

**Cost Estimate** (for hackathon/MVP):
- Average prompt: ~3k input tokens, ~2k output tokens per plan
- Cost per plan: (3k × $3.50 / 1M) + (2k × $10.50 / 1M) = ~$0.031 per plan
- For 1000 users × 2 plans each: **~$62/month** (cheaper than Claude/GPT-4)

**Alternatives Considered**:
- **OpenAI GPT-4 Turbo**: Strong structured output, but doesn't qualify for Google AI Hackathon. Rejected for hackathon requirement.
- **Claude 3.5 Sonnet**: Excellent quality, but also not Google-affiliated. Rejected, but kept in abstraction layer for future.
- **Gemini via AI Studio API**: Easier setup, but not production-grade (quotas, no SLA). Rejected for Vertex AI's enterprise features.

---

## 8. Testing Strategy (.NET Ecosystem)

### Decision: xUnit (Backend) + bUnit (Blazor Components) + Playwright (E2E)

**Layer 1: Unit Tests - xUnit + Moq**
- **Backend Services**: Test cycle calculations, AI response validation, plan regeneration logic
- **Mocking**: Moq library for mocking IAIPlanGenerator, IRepository interfaces
- **Coverage Target**: 70%+ for critical paths (cycle phase math, single active plan enforcement)

**Layer 2: Integration Tests - WebApplicationFactory**
- **API Endpoints**: Test full request/response flow with in-memory database
- **Database**: Testcontainers for PostgreSQL (Docker-based test DB)
- **Focus**: FR validation (FR-016: race date check, FR-017: single active plan)

**Layer 3: Component Tests - bUnit**
- **Blazor Components**: Test SessionCard, PlanCalendar, CycleLogForm rendering and interactions
- **Accessibility**: Verify ARIA labels, keyboard navigation via bUnit assertions

**Layer 4: E2E Tests - Playwright**
- **Full User Flows**: User Story P1-P4 scenarios
- **Accessibility**: axe-core integration (same as previous plan)
- **Browsers**: Chromium, Firefox, WebKit (cross-browser testing)

**Example xUnit Test**:
```csharp
public class CyclePhaseCalculatorTests
{
    [Fact]
    public void CalculateCurrentPhase_Day10_ShouldReturnFollicular()
    {
        // Arrange
        var lastPeriod = new DateOnly(2026, 1, 1);
        var targetDate = new DateOnly(2026, 1, 10);
        var calculator = new CyclePhaseCalculator();

        // Act
        var phase = calculator.CalculateCurrentPhase(lastPeriod, 28, targetDate);

        // Assert
        Assert.Equal(CyclePhase.Follicular, phase);
    }
}
```

**Alternatives Considered**:
- **NUnit/MSTest**: Also valid, but xUnit is more modern and idiomatic in .NET community. Deferred.
- **Cypress (E2E)**: Good, but Playwright has better cross-browser support and .NET SDK. Rejected.

---

## 9. Deployment & CI/CD (Google Cloud)

### Decision: Cloud Build + Cloud Run + GitHub Integration

**CI/CD Pipeline**:
1. **GitHub Push** → triggers Cloud Build
2. **Cloud Build** → builds .NET Docker image, runs tests
3. **Cloud Build** → pushes image to Google Artifact Registry
4. **Cloud Build** → deploys to Cloud Run (backend API)
5. **Cloud Build** → builds Blazor WASM, deploys to Cloud Storage + Cloud CDN (frontend)

**cloudbuild.yaml** (Backend):
```yaml
steps:
  # Build .NET API
  - name: 'gcr.io/cloud-builders/docker'
    args: ['build', '-t', 'gcr.io/$PROJECT_ID/herpace-api:$COMMIT_SHA', './backend']

  # Run tests
  - name: 'gcr.io/cloud-builders/docker'
    args: ['run', 'gcr.io/$PROJECT_ID/herpace-api:$COMMIT_SHA', 'dotnet', 'test']

  # Push to Artifact Registry
  - name: 'gcr.io/cloud-builders/docker'
    args: ['push', 'gcr.io/$PROJECT_ID/herpace-api:$COMMIT_SHA']

  # Deploy to Cloud Run
  - name: 'gcr.io/google.com/cloudsdktool/cloud-sdk'
    args:
      - 'gcloud'
      - 'run'
      - 'deploy'
      - 'herpace-api'
      - '--image=gcr.io/$PROJECT_ID/herpace-api:$COMMIT_SHA'
      - '--region=us-central1'
      - '--platform=managed'
      - '--allow-unauthenticated'
```

**Environments**:
- **Dev**: Deployed on every commit to `001-hormone-aware-training` branch
- **Staging**: Deployed on PR merge to `main`
- **Production**: Manual approval + deploy tag

**Alternatives Considered**:
- **GitHub Actions**: More familiar to many devs, but Cloud Build is native GCP and free tier is generous. Deferred for hackathon speed.
- **Manual Deployment**: Unacceptable for iterative development. Rejected.

---

## 10. Cost Estimation (Google Cloud MVP)

| Service | Configuration | Cost (Monthly - 1000 users) |
|---------|---------------|------------------------------|
| Cloud Run (API) | 2M requests, 512MB RAM | $8 |
| Cloud SQL (PostgreSQL) | db-f1-micro (0.6GB RAM), 10GB storage | $15 |
| Vertex AI (Gemini 1.5 Pro) | 2000 plans @ $0.031 each | $62 |
| Cloud Storage | 10GB (templates, backups) | $0.20 |
| Cloud Build | 120 builds/month (free tier) | $0 |
| Cloud CDN (Blazor WASM) | 10GB egress | $1 |
| **Total MVP** | | **~$86/month** |

**Scale Projection** (10k users):
| Service | Configuration | Cost (Monthly) |
|---------|---------------|----------------|
| Cloud Run | 20M requests, auto-scale | $50 |
| Cloud SQL | db-n1-standard-1 (3.75GB RAM), 50GB SSD, read replica | $120 |
| Vertex AI (Gemini) | 20k plans @ $0.031 | $620 |
| Cloud Storage | 50GB | $1 |
| Cloud CDN | 100GB egress | $8 |
| **Total at Scale** | | **~$799/month** |

**Hackathon Free Tier**:
- Google Cloud offers $300 free credit for new accounts (90 days)
- Sufficient for MVP development and demo
- Vertex AI has free tier for Gemini experimentation

---

## Summary: All Clarifications Resolved

| Technical Context Item | Resolution |
|------------------------|------------|
| Frontend Framework | Blazor WebAssembly (.NET 8) |
| Backend | ASP.NET Core Web API, C# 12, .NET 8.0 |
| Primary Dependencies | Entity Framework Core 8, Google.Cloud.AIPlatform.V1, MudBlazor, ASP.NET Core Identity |
| Storage | Google Cloud SQL for PostgreSQL 15+ |
| AI Integration | Google Gemini 1.5 Pro via Vertex AI (primary), abstraction layer for Claude/GPT-4 (future) |
| Testing | xUnit, bUnit (Blazor), Playwright, axe-core |
| Cloud Infrastructure | Google Cloud Platform (Cloud Run, Cloud SQL, Vertex AI, Cloud Storage, Cloud Build) |
| Authentication | ASP.NET Core Identity + JWT |
| UI Components | MudBlazor (WCAG 2.1 AA compliant) |
| Deployment | Cloud Build CI/CD → Cloud Run (API) + Cloud Storage/CDN (Blazor WASM) |

**Hackathon Qualification**: ✅ Gemini 1.5 Pro integrated via Vertex AI

**Next Steps**: Proceed to Phase 1 (Data Model, API Contracts, Quickstart with .NET/GCP specifics).
