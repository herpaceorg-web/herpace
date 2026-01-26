# Implementation Tasks: Hormone-Aware Training Plan System

**Feature**: Hormone-Aware Training Plan System (Google Cloud + .NET 8 + Gemini AI)
**Branch**: `001-hormone-aware-training`
**Tech Stack**: C# 12, .NET 8, Blazor WebAssembly, ASP.NET Core Web API, EF Core 8, Google Cloud (Cloud Run, Cloud SQL, Vertex AI - Gemini 1.5 Pro), MudBlazor
**Date Generated**: 2026-01-25

---

## Implementation Strategy

**MVP Scope**: User Story 1 (P1) - Create Personalized Training Plan
- Complete onboarding, profile creation, race entry, AI-powered plan generation
- Establishes core infrastructure (database, auth, AI integration, UI framework)
- **Independent Test Criteria**: User can sign up, create profile with cycle data, enter race, receive AI-generated training plan with cycle phase indicators

**Post-MVP Increments**:
- **Iteration 2**: User Story 2 (P2) - Interact with Daily Workouts (complete/skip/modify)
- **Iteration 3**: User Story 3 (P3) - Track Cycle & Phase-Optimized Guidance (cycle logging, real-time adjustments)
- **Iteration 4**: User Story 4 (P4) - Update Training Plan (regeneration based on progress/changes)

**Parallelization Strategy**:
- Tasks marked `[P]` can be executed in parallel with other `[P]` tasks (different files, no blocking dependencies)
- Within each user story phase, models/services/UI can often be developed in parallel
- Backend and frontend teams can work simultaneously after Phase 2 (Foundational) is complete

---

## User Story Dependency Graph

```
Phase 1 (Setup)
    ↓
Phase 2 (Foundational) ← MUST complete before all user stories
    ├─→ Phase 3: User Story 1 (P1) ← MVP (REQUIRED)
    │       ↓
    ├─→ Phase 4: User Story 2 (P2) ← Iteration 2 (depends on US1 entities)
    │
    ├─→ Phase 5: User Story 3 (P3) ← Iteration 3 (independent of US2, depends on US1)
    │
    └─→ Phase 6: User Story 4 (P4) ← Iteration 4 (depends on US1, US2)
        ↓
    Phase 7: Polish & Cross-Cutting
```

**Story Dependencies**:
- **US1 (P1)**: No dependencies (foundational)
- **US2 (P2)**: Depends on US1 (needs TrainingSession entity, active plan)
- **US3 (P3)**: Depends on US1 (needs Runner, TrainingPlan for adjustments); independent of US2
- **US4 (P4)**: Depends on US1 and US2 (regeneration uses workout history/feedback)

---

## Phase 1: Setup & Project Initialization

**Goal**: Initialize .NET solution, Google Cloud project, and development environment

**Task Count**: 10 tasks

### Tasks

- [X] T001 Create Google Cloud project and enable required APIs (Cloud Run, Cloud SQL, Vertex AI, Secret Manager) via gcloud CLI
- [X] T002 Create .NET solution structure (HerPace.sln, HerPace.API, HerPace.Core, HerPace.Infrastructure, HerPace.Tests) per plan.md
- [X] T003 [P] Install backend NuGet packages (Microsoft.AspNetCore.Identity.EntityFrameworkCore, Npgsql.EntityFrameworkCore.PostgreSQL, Google.Cloud.AIPlatform.V1) in HerPace.API/Infrastructure
- [X] T004 [P] Create Google Cloud SQL PostgreSQL instance (db-f1-micro, us-central1) and database via gcloud sql commands
- [X] T005 [P] Configure connection string in HerPace.API/appsettings.Development.json for local PostgreSQL and Cloud SQL
- [X] T006 Create Blazor WebAssembly project (HerPace.Client) and add MudBlazor NuGet package
- [X] T007 [P] Set up project references (API → Core + Infrastructure, Infrastructure → Core, Tests → all)
- [X] T008 [P] Create Dockerfile for HerPace.API (multi-stage build with .NET 8 SDK and aspnet runtime)
- [X] T009 [P] Create .gitignore for .NET projects (bin/, obj/, appsettings.Development.json, *.user)
- [X] T010 Initialize Git repository, create initial commit on branch 001-hormone-aware-training

**Completion Criteria**:
- ✅ Google Cloud project created with enabled APIs
- ✅ .NET solution compiles successfully (dotnet build)
- ✅ Cloud SQL instance accessible from local development
- ✅ Blazor project runs locally (dotnet run)

---

## Phase 2: Foundational Infrastructure (Blocking Prerequisites)

**Goal**: Establish core infrastructure required by all user stories (database schema, authentication, AI abstraction, base UI)

**Task Count**: 18 tasks

**BLOCKING**: All user story phases depend on completion of this phase

### Database & Data Access

- [X] T011 Create User entity extending IdentityUser<Guid> in HerPace.Core/Entities/User.cs with CreatedAt, DeletedAt (soft delete)
- [X] T012 [P] Create HerPaceDbContext extending IdentityDbContext in HerPace.Infrastructure/Data/HerPaceDbContext.cs with DbSets for all entities
- [X] T013 [P] Configure ASP.NET Core Identity in HerPace.API/Program.cs (AddIdentity, AddEntityFrameworkStores with HerPaceDbContext)
- [X] T014 [P] Create EF Core migration for Identity tables in HerPace.Infrastructure (dotnet ef migrations add IdentitySetup)
- [X] T015 Apply EF Core migration to local PostgreSQL database (dotnet ef database update)

### Authentication & Authorization

- [ ] T016 Implement JWT token generation service in HerPace.Infrastructure/Services/JwtTokenService.cs using appsettings Jwt:Secret
- [ ] T017 [P] Configure JWT authentication in HerPace.API/Program.cs (AddAuthentication with JwtBearerDefaults)
- [ ] T018 [P] Create AuthController in HerPace.API/Controllers/AuthController.cs with signup and login endpoints
- [ ] T019 [P] Create authentication middleware in HerPace.API/Middleware/AuthMiddleware.cs for JWT validation

### AI Integration (Gemini Abstraction)

- [ ] T020 Create IAIPlanGenerator interface in HerPace.Core/Interfaces/IAIPlanGenerator.cs with GeneratePlanAsync method signature
- [ ] T021 [P] Create GeminiPlanGenerator in HerPace.Infrastructure/AI/GeminiPlanGenerator.cs implementing IAIPlanGenerator using Google.Cloud.AIPlatform.V1
- [ ] T022 [P] Create FallbackPlanGenerator in HerPace.Infrastructure/AI/FallbackPlanGenerator.cs implementing IAIPlanGenerator (template-based for FR-015)
- [ ] T023 [P] Configure AI provider dependency injection in HerPace.API/Program.cs using appsettings AI:Provider switch (Gemini/Fallback)
- [ ] T024 [P] Create service account for Vertex AI and download JSON key, configure GOOGLE_APPLICATION_CREDENTIALS environment variable

### Frontend Foundation (Blazor + MudBlazor)

- [ ] T025 Configure MudBlazor in HerPace.Client/Program.cs (AddMudServices) and wwwroot/index.html (MudBlazor CSS/JS)
- [ ] T026 [P] Create MainLayout.razor in HerPace.Client/Shared/ with MudLayout, MudAppBar, MudDrawer (accessible navigation)
- [ ] T027 [P] Create API client service in HerPace.Client/Services/ApiClient.cs using HttpClient with JWT bearer token handling
- [ ] T028 [P] Set up routing in HerPace.Client/App.razor with routes for auth, onboarding, dashboard, plan, settings

**Completion Criteria**:
- ✅ Database migrations applied successfully
- ✅ User can sign up and login, receive JWT token
- ✅ Gemini AI integration verified (test call to Vertex AI returns response)
- ✅ Blazor app loads with MudBlazor layout and navigation

---

## Phase 3: User Story 1 (P1) - Create Personalized Training Plan

**Story Goal**: A woman runner signs up for the app, enters her target race details (date, distance), provides basic health information including cycle data, and receives an AI-generated training plan that adapts to her menstrual cycle phases.

**Priority**: P1 (MVP - Core Value Proposition)

**Independent Test Criteria**:
- ✅ User completes signup flow (email/password)
- ✅ User creates Runner profile with fitness level (Beginner/Intermediate/Advanced/Elite), cycle length, last period start date, optional calibration data
- ✅ User creates Race with name, date (≥7 days future per FR-016), distance, optional goal time
- ✅ System generates training plan via Gemini AI with sessions distributed from today to race date
- ✅ User views plan with visual cycle phase indicators (Follicular, Ovulatory, Luteal, Menstrual)
- ✅ Plan generation completes in <5 seconds (SC-007) or falls back to template-based plan

**Task Count**: 32 tasks

### Backend: Domain Entities (Data Model)

- [ ] T029 [P] [US1] Create Runner entity in HerPace.Core/Entities/Runner.cs with FitnessLevel enum, CycleLength, LastPeriodStart, TypicalCycleRegularity enum, RecentRaceTime, TypicalWeeklyMileage, DistanceUnit enum
- [ ] T030 [P] [US1] Create Race entity in HerPace.Core/Entities/Race.cs with RaceName, RaceDate, Distance, DistanceType enum, GoalTime, IsPublic
- [ ] T031 [P] [US1] Create TrainingPlan entity in HerPace.Core/Entities/TrainingPlan.cs with Status enum (Active/Archived/Completed), GenerationSource enum (AI/Fallback), AiModel, AiRationale, StartDate, EndDate
- [ ] T032 [P] [US1] Create TrainingSession entity in HerPace.Core/Entities/TrainingSession.cs with WorkoutType enum (Easy/Long/Tempo/Interval/Rest), DurationMinutes, Distance, IntensityLevel enum, CyclePhase enum, PhaseGuidance, ScheduledDate
- [ ] T033 [US1] Configure EF Core relationships in HerPaceDbContext.OnModelCreating (User 1:1 Runner, Runner 1:* Race, Race 1:0..1 TrainingPlan Active per FR-017, TrainingPlan 1:* TrainingSession)
- [ ] T034 [US1] Add unique partial index for single active plan constraint in HerPaceDbContext (HasIndex on RunnerId + Status with filter Status = 'Active' per FR-017)
- [ ] T035 [US1] Create EF Core migration for US1 entities (dotnet ef migrations add UserStory1Entities)

### Backend: Business Logic Services

- [ ] T036 [P] [US1] Create ICyclePhaseCalculator interface in HerPace.Core/Interfaces/ with CalculateCurrentPhase and PredictPhasesForRange methods
- [ ] T037 [P] [US1] Implement CyclePhaseCalculator service in HerPace.Infrastructure/Services/Cycle/CyclePhaseCalculator.cs (28-day cycle algorithm from research.md)
- [ ] T038 [P] [US1] Create IRaceService interface in HerPace.Core/Interfaces/ with CreateRace and ValidateRaceDate methods
- [ ] T039 [P] [US1] Implement RaceService in HerPace.Infrastructure/Services/RaceService.cs with FR-016 validation (race date ≥7 days future)
- [ ] T040 [P] [US1] Create IPlanGenerationService interface in HerPace.Core/Interfaces/ with GeneratePlanAsync and ValidateAIResponse methods
- [ ] T041 [US1] Implement PlanGenerationService in HerPace.Infrastructure/Services/Plan/PlanGenerationService.cs orchestrating cycle calculation + AI call + FR-017 single active plan check
- [ ] T042 [US1] Implement Gemini prompt builder in GeminiPlanGenerator.BuildPlanPrompt with user profile, race goal, cycle phases, workout type constraints (per research.md Section 7)
- [ ] T043 [US1] Implement AI response validation in PlanGenerationService.ValidateAIResponse checking JSON schema (plan metadata + sessions array per FR-021)
- [ ] T044 [US1] Implement fallback plan selection in FallbackPlanGenerator.SelectTemplate based on race DistanceType and Runner FitnessLevel (research.md Section 7)

### Backend: API Endpoints

- [ ] T045 [P] [US1] Create ProfileController in HerPace.API/Controllers/ with POST /profiles/me endpoint (create Runner profile, validate cycle length 21-45 days)
- [ ] T046 [P] [US1] Add GET /profiles/me endpoint to ProfileController (retrieve authenticated user's Runner profile)
- [ ] T047 [P] [US1] Create RaceController in HerPace.API/Controllers/ with POST /races endpoint (validate FR-016: date ≥7 days future, return error message if violated)
- [ ] T048 [P] [US1] Create PlanController in HerPace.API/Controllers/ with POST /plans endpoint (check FR-017 single active plan constraint, call PlanGenerationService, return 409 Conflict if active plan exists)
- [ ] T049 [P] [US1] Add GET /plans/active endpoint to PlanController (retrieve user's active TrainingPlan with sessions)
- [ ] T050 [US1] Add global exception handler in HerPace.API/Middleware/ErrorHandlingMiddleware.cs catching AI_GENERATION_FAILED exception and triggering fallback plan per FR-015

### Frontend: Blazor Components & Pages

- [ ] T051 [P] [US1] Create Signup.razor page in HerPace.Client/Pages/Auth/ with MudTextField for email/password, call POST /auth/signup, store JWT in localStorage
- [ ] T052 [P] [US1] Create Login.razor page in HerPace.Client/Pages/Auth/ with MudTextField, call POST /auth/login
- [ ] T053 [P] [US1] Create ProfileSetup.razor page in HerPace.Client/Pages/Onboarding/ with MudSelect for FitnessLevel, MudNumericField for CycleLength (21-45 validation), MudDatePicker for LastPeriodStart, MudRadioGroup for TypicalCycleRegularity
- [ ] T054 [P] [US1] Create RaceEntry.razor page in HerPace.Client/Pages/Onboarding/ with MudTextField for RaceName, MudDatePicker for RaceDate (min 7 days future client-side validation), MudNumericField for Distance, MudSelect for DistanceType
- [ ] T055 [P] [US1] Create PlanView.razor page in HerPace.Client/Pages/Plan/ displaying TrainingPlan with MudDataGrid showing TrainingSessions (columns: Date, WorkoutType, Duration, Distance, CyclePhase badge)
- [ ] T056 [P] [US1] Create PhaseIndicator.razor component in HerPace.Client/Components/Plan/ using MudChip with color-coded cycle phases (Follicular=Green, Ovulatory=Yellow, Luteal=Orange, Menstrual=Red)
- [ ] T057 [P] [US1] Create PlanLoadingState.razor component in HerPace.Client/Components/Plan/ with MudProgressLinear and "Generating your personalized plan..." message (displayed during AI call)
- [ ] T058 [US1] Implement navigation flow in HerPace.Client/App.razor routing Signup → ProfileSetup → RaceEntry → POST /plans → PlanView (redirect to /plan on successful plan generation)
- [ ] T059 [US1] Add accessibility attributes to all US1 Blazor components (AriaLabel on MudButton, form labels via MudTextField Label property, semantic headings)
- [ ] T060 [US1] Test responsive layout for US1 pages on 360px mobile viewport using browser dev tools (verify MudBlazor responsive grid)

**Acceptance Scenario Validation**:
1. ✅ AS1.1: User signs up, enters London Marathon 2026 (April 26), cycle 28 days, receives plan with workouts from today to race day with varying intensity per cycle phase
2. ✅ AS1.2: User indicates irregular cycles, system generates plan with more recovery emphasis (FallbackPlanGenerator uses conservative template)
3. ✅ AS1.3: User enters race <4 weeks away, system generates shorter plan focused on maintenance (Gemini prompt adjusted for short timeline)
4. ✅ AS1.4: User views plan with visual cycle phase indicators (PhaseIndicator component on each session row)

**Completion Criteria**:
- ✅ End-to-end flow: Signup → Create profile → Enter race → View generated plan (manual browser test)
- ✅ Database contains User, Runner, Race, TrainingPlan, TrainingSession records after flow
- ✅ Plan generation uses Gemini AI (verify AiModel field = "gemini-1.5-pro") or fallback (GenerationSource = "Fallback")
- ✅ Cycle phases visible on plan view (4 distinct phase colors)
- ✅ All MudBlazor components render with accessibility (inspect ARIA labels in browser)

---

## Phase 4: User Story 2 (P2) - Interact with Daily Workouts

**Story Goal**: A user views their daily suggested workout, can mark it complete, skip it, or modify it, and the system adapts future suggestions based on their compliance and feedback.

**Priority**: P2 (Post-MVP Iteration 2 - User Agency)

**Dependencies**: Requires Phase 3 (US1) completion - needs TrainingSession entity and active plan

**Independent Test Criteria**:
- ✅ User views today's workout (GET /sessions/today returns session scheduled for current date)
- ✅ User marks workout as completed with optional notes (PATCH /sessions/{id} sets Status=Completed, CompletedAt timestamp)
- ✅ User skips workout with reason (Status=Skipped, SkipReason enum: Sick/Injury/Life/Other)
- ✅ User modifies workout (fully customize type, duration, intensity per clarification) (Status=Modified, stores original values in ModifiedFrom fields)
- ✅ System logs interactions (FR-009) for future plan adjustments

**Task Count**: 15 tasks

### Backend: Extend Entities

- [ ] T061 [P] [US2] Add Status enum to TrainingSession entity (Scheduled/Completed/Skipped/Modified), CompletedAt timestamp, UserNotes text field
- [ ] T062 [P] [US2] Add SkipReason enum field (Sick/Injury/Life/Other) and modification tracking fields (ModifiedFromType, ModifiedFromDuration, ModifiedFromIntensity) to TrainingSession
- [ ] T063 [US2] Create EF Core migration for US2 TrainingSession extensions (dotnet ef migrations add UserStory2SessionTracking)

### Backend: Business Logic

- [ ] T064 [P] [US2] Create ISessionInteractionService interface in HerPace.Core/Interfaces/ with MarkCompleted, SkipSession, ModifySession methods
- [ ] T065 [US2] Implement SessionInteractionService in HerPace.Infrastructure/Services/SessionInteractionService.cs validating state transitions (Scheduled → Completed/Skipped/Modified per data-model.md)
- [ ] T066 [US2] Implement workout redistribution logic in SessionInteractionService.RedistributeAfterSkip (FR-008: redistribute remaining workouts without overloading future weeks, maintain ≤10% weekly mileage increase per SC-008)

### Backend: API Endpoints

- [ ] T067 [P] [US2] Create SessionController in HerPace.API/Controllers/ with GET /sessions/today endpoint (filter TrainingSessions by authenticated user's active plan and ScheduledDate = today)
- [ ] T068 [P] [US2] Add PATCH /sessions/{id} endpoint to SessionController accepting Status, UserNotes, SkipReason, modification fields (WorkoutType, DurationMinutes, IntensityLevel)
- [ ] T069 [US2] Validate PATCH /sessions/{id} request (if Status=Modified, at least one Modified field must differ from original; if Status=Skipped, SkipReason recommended)

### Frontend: Blazor Components & Pages

- [ ] T070 [P] [US2] Create Dashboard.razor page in HerPace.Client/Pages/Dashboard/ calling GET /sessions/today on load
- [ ] T071 [P] [US2] Create SessionCard.razor component in HerPace.Client/Components/Plan/ (from quickstart-gcp-dotnet.md) with MudCard displaying workout details, cycle phase badge, phase guidance
- [ ] T072 [P] [US2] Add action buttons to SessionCard (MudButton Complete/Modify/Skip with OnClick event handlers calling PATCH /sessions/{id})
- [ ] T073 [P] [US2] Create ModifyWorkoutDialog.razor component in HerPace.Client/Components/Plan/ with MudDialog containing MudSelect for WorkoutType, MudNumericField for Duration/Distance, MudSelect for IntensityLevel
- [ ] T074 [P] [US2] Create SkipWorkoutDialog.razor with MudRadioGroup for SkipReason and optional MudTextField for notes
- [ ] T075 [US2] Implement optimistic UI updates in SessionCard (update Status locally on button click, revert if API call fails)

**Acceptance Scenario Validation**:
1. ✅ AS2.1: User opens app, views today's workout "Easy 5K - Follicular Phase" with phase tip
2. ✅ AS2.2: User marks complete with note "Felt great!", system logs CompletedAt and UserNotes
3. ✅ AS2.3: User skips workout with reason "Sick", system redistributes remaining workouts (verified by checking future sessions' dates/intensities don't overload)
4. ✅ AS2.4: User skips multiple high-intensity workouts, triggers plan regeneration with reduced load (requires integration with US4 regeneration service)

**Completion Criteria**:
- ✅ Dashboard shows today's workout
- ✅ Complete/Skip/Modify actions persist to database (verify TrainingSession.Status updated)
- ✅ Modification dialog captures full workout customization (all 3 attributes: type, duration, intensity)
- ✅ MudBlazor dialogs keyboard-accessible (Esc closes, Tab navigates fields)

---

## Phase 5: User Story 3 (P3) - Track Cycle & Phase-Optimized Guidance

**Story Goal**: A user logs cycle events (period start, symptoms, energy levels) and receives personalized insights and workout adjustments based on their current cycle phase.

**Priority**: P3 (Iteration 3 - Enhanced Intelligence)

**Dependencies**: Requires Phase 3 (US1) completion - needs Runner and TrainingPlan entities for adjustments; independent of US2

**Independent Test Criteria**:
- ✅ User logs period start date (POST /cycle/logs with EventType=PeriodStart updates Runner.LastPeriodStart per FR-012)
- ✅ User logs symptom (EventType=Symptom with Symptom text field)
- ✅ User logs energy level (EventType=EnergyLevel with 1-5 scale)
- ✅ System recalculates current cycle phase (GET /cycle/current-phase uses updated LastPeriodStart)
- ✅ System adjusts this week's workouts based on logged phase (if Menstrual logged, shift Interval→Easy in current week)

**Task Count**: 12 tasks

### Backend: Domain Entities

- [ ] T076 [P] [US3] Create CycleLog entity in HerPace.Core/Entities/CycleLog.cs with EventType enum (PeriodStart/Symptom/EnergyLevel), LogDate, Symptom string, EnergyLevel int (1-5), Notes text
- [ ] T077 [US3] Configure CycleLog relationship in HerPaceDbContext (Runner 1:* CycleLog) and create EF Core migration

### Backend: Business Logic

- [ ] T078 [P] [US3] Create ICycleLoggingService interface in HerPace.Core/Interfaces/ with LogEvent and UpdateRunnerFromLog methods
- [ ] T079 [US3] Implement CycleLoggingService in HerPace.Infrastructure/Services/Cycle/CycleLoggingService.cs (if EventType=PeriodStart, update Runner.LastPeriodStart to LogDate per data-model.md validation rules)
- [ ] T080 [US3] Create IPlanAdjustmentService interface in HerPace.Core/Interfaces/ with AdjustPlanBasedOnCycleLog method
- [ ] T081 [US3] Implement PlanAdjustmentService in HerPace.Infrastructure/Services/Plan/PlanAdjustmentService.cs (if Menstrual phase logged, reduce intensity of current week's sessions: Interval→Easy, Tempo→Easy, add Rest days)

### Backend: API Endpoints

- [ ] T082 [P] [US3] Create CycleController in HerPace.API/Controllers/ with POST /cycle/logs endpoint validating EventType-specific fields (if Symptom, require Symptom field; if EnergyLevel, require 1-5 value)
- [ ] T083 [P] [US3] Add GET /cycle/logs endpoint with optional startDate/endDate query parameters for chronological retrieval
- [ ] T084 [P] [US3] Add GET /cycle/current-phase endpoint calling ICyclePhaseCalculator with Runner's updated LastPeriodStart, returning phase + dayInCycle + nextPeriodEstimate

### Frontend: Blazor Components & Pages

- [ ] T085 [P] [US3] Create CycleTracking.razor page in HerPace.Client/Pages/Settings/ with MudDatePicker for LogDate, MudRadioGroup for EventType
- [ ] T086 [P] [US3] Add conditional fields to CycleTracking.razor (if EventType=Symptom, show MudTextField for Symptom; if EnergyLevel, show MudRating 1-5 stars)
- [ ] T087 [US3] Create CyclePhaseDisplay.razor component in HerPace.Client/Components/Cycle/ calling GET /cycle/current-phase, displaying phase name, day in cycle, next period estimate with visual calendar icon

**Acceptance Scenario Validation**:
1. ✅ AS3.1: User logs period start, system adjusts this week to Easy/Rest emphasis (verify TrainingSessions updated via PlanAdjustmentService)
2. ✅ AS3.2: User in Follicular phase views encouragement for Interval/Tempo (displayed via PhaseGuidance field from AI plan generation)
3. ✅ AS3.3: User consistently logs low energy in Luteal, future plans reduce Luteal intensity (requires US4 regeneration to incorporate logged patterns)
4. ✅ AS3.4: User with irregular cycles logs actual phase transitions, predictions update in real-time (LastPeriodStart change recalculates CyclePhaseCalculator output)

**Completion Criteria**:
- ✅ User can log all 3 event types (PeriodStart, Symptom, EnergyLevel)
- ✅ Logging period start updates current phase calculation (verify GET /cycle/current-phase changes)
- ✅ Accessibility: MudRating component keyboard-navigable (Arrow keys change rating)

---

## Phase 6: User Story 4 (P4) - Update Training Plan

**Story Goal**: A user who has been following their plan for several weeks can request plan updates based on progress, changing goals, or new health information, and the AI regenerates an optimized continuation.

**Priority**: P4 (Iteration 4 - Long-term Engagement)

**Dependencies**: Requires Phase 3 (US1) and Phase 4 (US2) - regeneration uses workout completion history and feedback

**Independent Test Criteria**:
- ✅ User requests plan regeneration (POST /plans/{id}/regenerate with optional reason and updatedProfile)
- ✅ System incorporates completion history (analyze CompletedAt timestamps, SkipReason frequency) into new Gemini prompt
- ✅ System regenerates remaining weeks (sessions after today) while preserving completed sessions (Status=Completed not overwritten)
- ✅ User updates race date (PATCH /races/{id} with new RaceDate) and plan automatically regenerates (FR-019)

**Task Count**: 10 tasks

### Backend: Business Logic

- [ ] T088 [P] [US4] Extend IPlanGenerationService with RegeneratePlanAsync method accepting current TrainingPlan, completion history, and optional profile updates
- [ ] T089 [US4] Implement RegeneratePlanAsync in PlanGenerationService (delete future Scheduled sessions, create new sessions from today to race date, preserve Completed/Skipped sessions)
- [ ] T090 [US4] Enhance Gemini prompt builder in GeminiPlanGenerator to include completion statistics (e.g., "User completed 80% of workouts, skipped 3 Interval sessions due to Injury") for adaptive regeneration
- [ ] T091 [US4] Implement safe progression validation in PlanGenerationService.ValidateRegeneratedPlan (ensure no week-over-week mileage increase >10% per SC-008)

### Backend: API Endpoints

- [ ] T092 [P] [US4] Add POST /plans/{id}/regenerate endpoint to PlanController accepting optional reason string and updatedProfile DTO
- [ ] T093 [P] [US4] Add PATCH /races/{id} endpoint to RaceController (update RaceName, RaceDate, GoalTime per FR-019, trigger plan regeneration if active plan exists)
- [ ] T094 [US4] Return planRegenerated boolean flag in PATCH /races/{id} response indicating whether associated plan was regenerated

### Frontend: Blazor Components & Pages

- [ ] T095 [P] [US4] Add "Regenerate Plan" MudButton to PlanView.razor with MudDialog prompting for reason (e.g., "Feeling stronger", "Injury recovery")
- [ ] T096 [P] [US4] Create RaceEdit.razor page in HerPace.Client/Pages/Settings/ with MudTextField/MudDatePicker for updating race details, call PATCH /races/{id}
- [ ] T097 [US4] Display regeneration confirmation in PlanView.razor (if planRegenerated=true, show MudAlert "Your plan has been updated to reflect the new race date")

**Acceptance Scenario Validation**:
1. ✅ AS4.1: User after 4 weeks requests regeneration noting "feeling stronger", AI increases intensity while respecting cycle phases (verify new sessions have higher IntensityLevel distribution)
2. ✅ AS4.2: User changes race date (postponed 2 weeks), system regenerates to peak at new date (verify TrainingPlan.EndDate matches new RaceDate, sessions redistributed)
3. ✅ AS4.3: User recovering from injury provides return date, plan includes gradual reintroduction (Gemini prompt includes injury context, validates gradual intensity ramp)

**Completion Criteria**:
- ✅ Regeneration preserves completed workouts (verify Completed sessions not deleted)
- ✅ New sessions generated from today to race date (verify ScheduledDate coverage)
- ✅ Race date update triggers regeneration (verify PATCH /races response includes planRegenerated=true)

---

## Phase 7: Polish & Cross-Cutting Concerns

**Goal**: Finalize deployment, accessibility audits, error handling, and production readiness

**Task Count**: 12 tasks

### Deployment & Cloud Infrastructure

- [ ] T098 [P] Configure Cloud Build trigger in Google Cloud Console linking GitHub repo to cloudbuild.yaml (trigger on push to 001-hormone-aware-training branch)
- [ ] T099 [P] Create cloudbuild.yaml in repo root with steps: docker build, dotnet test, push to Artifact Registry, deploy to Cloud Run (per research.md Section 9)
- [ ] T100 [P] Deploy HerPace.API to Cloud Run (gcloud run deploy herpace-api with Cloud SQL connection via --add-cloudsql-instances flag)
- [ ] T101 [P] Build and deploy Blazor WASM to Cloud Storage + Cloud CDN (dotnet publish, gsutil cp to gs://herpace-app-frontend)
- [ ] T102 [P] Configure Cloud SQL connection string in Cloud Run environment variables (set ConnectionStrings__HerPaceDb via --set-env-vars)
- [ ] T103 [P] Set up Secret Manager for Jwt:Secret and GOOGLE_APPLICATION_CREDENTIALS, reference in Cloud Run deployment

### Accessibility & Testing

- [ ] T104 [P] Run Playwright + axe-core accessibility audit on all Blazor pages (Signup, ProfileSetup, RaceEntry, Dashboard, PlanView, CycleTracking) and fix violations
- [ ] T105 [P] Manual keyboard navigation test (Tab through all forms, verify MudBlazor focus indicators visible, Esc closes dialogs)
- [ ] T106 [P] Screen reader test with NVDA or VoiceOver (verify ARIA labels announce correctly on SessionCard, PhaseIndicator)

### Error Handling & Monitoring

- [ ] T107 [P] Implement global error handling in HerPace.API/Middleware/ErrorHandlingMiddleware.cs (catch exceptions, return standardized JSON error responses)
- [ ] T108 [P] Add logging to GeminiPlanGenerator (log Gemini API call latency, response size, fallback triggers) using ILogger<GeminiPlanGenerator>
- [ ] T109 [P] Set up Cloud Logging export for HerPace.API (Cloud Run automatically logs stdout/stderr, configure log-based metrics for error rates)

**Completion Criteria**:
- ✅ Cloud Run deployment successful (API accessible via https://<service-url>.run.app)
- ✅ Blazor WASM loads from Cloud Storage (frontend accessible via https://storage.googleapis.com/herpace-app-frontend/index.html or Cloud CDN URL)
- ✅ Accessibility audit shows 0 WCAG 2.1 AA violations (axe-core report)
- ✅ All MudBlazor components keyboard-navigable (manual test checklist complete)

---

## Task Summary

**Total Tasks**: 109

**Tasks by Phase**:
- Phase 1 (Setup): 10 tasks
- Phase 2 (Foundational): 18 tasks
- Phase 3 (US1 - P1): 32 tasks ← **MVP**
- Phase 4 (US2 - P2): 15 tasks
- Phase 5 (US3 - P3): 12 tasks
- Phase 6 (US4 - P4): 10 tasks
- Phase 7 (Polish): 12 tasks

**Parallelizable Tasks**: 58 tasks marked [P] (53% can run in parallel)

**User Story Task Breakdown**:
- US1 (Create Plan): 32 tasks (entities, cycle calc, AI integration, onboarding UI)
- US2 (Interact): 15 tasks (session tracking, complete/skip/modify, dashboard)
- US3 (Cycle Logging): 12 tasks (cycle logs, phase adjustments, tracking UI)
- US4 (Regeneration): 10 tasks (regeneration logic, race editing)

---

## Parallel Execution Examples

### Phase 1 (Setup) - Parallel Opportunities

**Stream 1** (Backend Developer):
- T002: Create .NET solution structure
- T003: Install backend NuGet packages
- T007: Set up project references

**Stream 2** (DevOps):
- T001: Create Google Cloud project, enable APIs
- T004: Create Cloud SQL instance
- T008: Create Dockerfile

**Stream 3** (Frontend Developer):
- T006: Create Blazor WASM project
- (waits for T002 completion to add to solution)

**Estimated Time**: 2-3 hours (parallel) vs 6-8 hours (sequential)

### Phase 3 (US1) - Parallel Opportunities

**Stream 1** (Backend - Entities):
- T029-T032: Create all entities in parallel (Runner, Race, TrainingPlan, TrainingSession)
- T033-T034: Configure EF Core relationships

**Stream 2** (Backend - Services):
- T036-T037: Cycle phase calculator (independent of entities)
- T038-T039: Race service validation (after T030 Race entity)

**Stream 3** (Backend - AI):
- T042: Gemini prompt builder (independent, uses interface)
- T044: Fallback template generator (independent)

**Stream 4** (Frontend):
- T051-T052: Auth pages (Signup, Login) - parallel after T002
- T053-T054: Onboarding pages (Profile, Race) - parallel

**Estimated Time**: MVP (Phase 1-3) completable in 3-5 days with 3-4 developers vs 10-15 days solo

---

## MVP Delivery Checklist

**Definition**: User Story 1 (P1) fully functional = user can generate personalized training plan

- [ ] Phase 1 complete (setup verified via dotnet build success)
- [ ] Phase 2 complete (auth works, Gemini API test succeeds)
- [ ] Phase 3 complete (end-to-end flow tested):
  - [ ] User signs up via Signup.razor
  - [ ] User creates profile via ProfileSetup.razor
  - [ ] User enters race via RaceEntry.razor
  - [ ] System generates plan (Gemini or fallback)
  - [ ] User views plan via PlanView.razor with cycle phase indicators
- [ ] Accessibility: Keyboard navigation works (Tab, Enter, Esc)
- [ ] Deployment: API deployed to Cloud Run, Blazor to Cloud Storage
- [ ] Performance: Plan generation <5 seconds (measure with browser DevTools)

**Post-MVP**: Iteratively deliver US2 (P2), US3 (P3), US4 (P4) in subsequent sprints

---

## Notes for Implementation

1. **Gemini Integration**: Requires `GOOGLE_APPLICATION_CREDENTIALS` environment variable pointing to service account JSON key (T024). Test locally before Cloud Run deployment.

2. **EF Core Migrations**: Run `dotnet ef database update` after each migration task (T014, T035, T063, T077). Use `--startup-project HerPace.API` flag from Infrastructure directory.

3. **MudBlazor Accessibility**: Components are pre-configured for WCAG 2.1 AA, but verify AriaLabel on icon-only buttons (T059, T072) and test with keyboard (T105).

4. **Single Active Plan Constraint (FR-017)**: PostgreSQL partial unique index in T034 enforces at database level. API layer (T048) provides user-friendly error message before DB constraint violation.

5. **AI Response Validation (FR-021)**: T043 validates JSON schema. If malformed, throw exception caught by T050 to trigger fallback plan (FR-015).

6. **Cost Management**: Gemini API calls cost ~$0.031 per plan (research.md Section 7). Monitor usage in Google Cloud Console under Vertex AI quotas. Use $300 free credit during hackathon development.

7. **Hackathon Demo**: Focus on US1 (P1) for demo. Highlight Gemini integration (show AiModel="gemini-1.5-pro" in database), cycle phase visual indicators, and <5 second generation time.

8. **Testing Strategy**: Manual testing prioritized per constitution (early stage). Add xUnit tests for CyclePhaseCalculator (T037) and PlanGenerationService (T041) for critical business logic once MVP stable.

---

**Ready to implement!** Start with Phase 1 (Setup) to establish infrastructure, then proceed to Phase 2 (Foundational) to enable all user story development. MVP = Phase 1 + 2 + 3 (US1).

**Next Steps**:
1. Execute Phase 1 tasks (T001-T010)
2. Verify Google Cloud project and .NET solution compile
3. Begin Phase 2 (T011-T028) to build foundational auth and AI integration
4. Implement US1 (T029-T060) for hackathon demo
