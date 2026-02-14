# Implementation Plan: Fitness Tracker Integration

**Branch**: `002-fitness-tracker-integration` | **Date**: 2026-02-11 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/002-fitness-tracker-integration/spec.md`

## Summary

Integrate HerPace with major fitness tracking platforms (Strava, Health Connect, Garmin) to automatically import running activity data. Imported runs are stored as separate entities linked to existing TrainingSession records, feeding into the AI training plan generator for actual-vs-planned comparisons and adaptive plan adjustments. The integration follows a phased approach: Strava (OAuth 2.0 + webhooks) first for broadest coverage, Health Connect (on-device Android SDK) second for native device data, and Garmin (developer program API) third for richer metrics and women's health cycle data.

## Technical Context

**Language/Version**: C# 12 / .NET 8.0 (Backend API), Kotlin (Android), TypeScript / React 19 (Frontend)
**Primary Dependencies**: ASP.NET Core Web API, Entity Framework Core 8, Hilt + Room + Retrofit (Android), Health Connect SDK (Android), React Router + shadcn/ui (Frontend)
**Storage**: PostgreSQL 15+ via Google Cloud SQL (Backend), Room with SQLCipher (Android local)
**Testing**: xUnit (Backend), manual testing for MVP per constitution iterative principle
**Target Platform**: Android (mobile), Web (React SPA), Google Cloud Run (API)
**Project Type**: Mobile + Web + API (multi-platform)
**Performance Goals**: Activities imported within 10 minutes of source sync (SC-003), Connected Services screen loads in under 2 seconds (SC-008), initial historical import within 5 minutes (SC-001)
**Constraints**: Strava rate limits (200 req/15min, 2,000/day per app), Health Connect is on-device only (no cloud API), Garmin requires developer program approval (longer lead time)
**Scale/Scope**: 3 integrations (Strava, Health Connect, Garmin), targeting existing user base

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Evidence |
|-----------|--------|----------|
| I. User-Centric Development | PASS | 5 user stories with Given-When-Then acceptance scenarios, 8 measurable success criteria, 8 edge cases documented. Features independently testable. |
| II. Accessibility-First Design | PASS | Connected Services screen and run detail views will follow WCAG 2.1 AA. OAuth redirect flows use standard browser/system auth screens. Health Connect uses native Android permission dialogs. |
| III. Iterative Excellence | PASS | Phased delivery: Strava MVP first (broadest coverage), Health Connect second (native Android), Garmin third (requires partner approval). Each phase independently valuable. |

**Post-Phase 1 Re-check:**

| Principle | Status | Notes |
|-----------|--------|-------|
| I. User-Centric Development | PASS | Data model supports all acceptance scenarios. API contracts map 1:1 to user actions. |
| II. Accessibility-First Design | PASS | API responses include sufficient data for accessible UI rendering. No visual-only indicators in data model. |
| III. Iterative Excellence | PASS | Contracts designed so Strava can ship independently. Health Connect and Garmin extend the same interfaces. |

## Project Structure

### Documentation (this feature)

```text
specs/002-fitness-tracker-integration/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   ├── connected-services-api.md
│   └── webhook-contracts.md
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
backend/
├── src/
│   ├── HerPace.API/
│   │   └── Controllers/
│   │       └── FitnessTrackerController.cs     # OAuth callbacks, sync endpoints, service management
│   ├── HerPace.Core/
│   │   ├── Entities/
│   │   │   ├── ConnectedService.cs             # NEW: OAuth credentials, connection status
│   │   │   ├── ImportedActivity.cs             # NEW: Normalized run data from external sources
│   │   │   └── SyncLog.cs                      # NEW: Sync event tracking
│   │   ├── DTOs/
│   │   │   └── FitnessTrackerDtos.cs           # NEW: Request/response DTOs
│   │   ├── Enums/
│   │   │   ├── FitnessPlatform.cs              # NEW: Strava, HealthConnect, Garmin
│   │   │   └── ConnectionStatus.cs             # NEW: Connected, Disconnected, ErrorTokenExpired
│   │   └── Interfaces/
│   │       ├── IFitnessTrackerService.cs       # NEW: Connect/disconnect/sync operations
│   │       └── IActivityImportService.cs       # NEW: Import, normalize, deduplicate
│   └── HerPace.Infrastructure/
│       ├── Data/
│       │   └── HerPaceDbContext.cs             # MODIFY: Add DbSets for new entities
│       ├── Migrations/
│       │   └── [timestamp]_AddFitnessTracker.cs # NEW: Migration for new tables
│       └── Services/
│           ├── FitnessTrackerService.cs        # NEW: OAuth flow orchestration
│           ├── ActivityImportService.cs         # NEW: Import + dedup logic
│           └── Providers/
│               ├── StravaProvider.cs            # NEW: Strava API client
│               ├── GarminProvider.cs            # NEW: Garmin API client
│               └── IFitnessProvider.cs          # NEW: Provider interface

android/
├── app/src/main/java/com/herpace/
│   ├── data/
│   │   ├── local/
│   │   │   ├── entity/
│   │   │   │   ├── ConnectedServiceEntity.kt   # NEW: Local connected service record
│   │   │   │   └── ImportedActivityEntity.kt   # NEW: Local imported activity cache
│   │   │   └── dao/
│   │   │       └── FitnessTrackerDao.kt        # NEW: Room DAO
│   │   ├── remote/
│   │   │   └── dto/
│   │   │       └── FitnessTrackerDtos.kt       # NEW: API DTOs
│   │   └── repository/
│   │       ├── FitnessTrackerRepositoryImpl.kt # NEW: Repository implementation
│   │       └── HealthConnectRepositoryImpl.kt  # NEW: Health Connect on-device reader
│   ├── domain/
│   │   ├── model/
│   │   │   ├── ConnectedService.kt             # NEW: Domain model
│   │   │   └── ImportedActivity.kt             # NEW: Domain model
│   │   ├── repository/
│   │   │   ├── FitnessTrackerRepository.kt     # NEW: Repository interface
│   │   │   └── HealthConnectRepository.kt      # NEW: Health Connect interface
│   │   └── usecase/
│   │       └── SyncActivitiesUseCase.kt        # NEW: Orchestrate sync
│   ├── di/
│   │   └── FitnessTrackerModule.kt             # NEW: Hilt DI module
│   └── ui/
│       └── connectedservices/
│           ├── ConnectedServicesScreen.kt       # NEW: Compose UI
│           └── ConnectedServicesViewModel.kt    # NEW: ViewModel

frontend/
├── src/
│   ├── pages/
│   │   └── ConnectedServices.tsx               # NEW: Connected Services management page
│   ├── components/
│   │   └── fitness-tracker/
│   │       ├── ServiceCard.tsx                  # NEW: Individual service connect/disconnect card
│   │       ├── SyncStatus.tsx                   # NEW: Last sync time, activity count
│   │       └── OAuthCallback.tsx               # NEW: OAuth redirect handler
│   ├── types/
│   │   └── api.ts                              # MODIFY: Add fitness tracker types
│   └── lib/
│       └── api-client.ts                       # MODIFY: Add fitness tracker API methods
```

**Structure Decision**: Extends the existing multi-platform architecture (Backend API + Android + Frontend). New entities and services follow the established layered pattern (Core entities/interfaces → Infrastructure implementations → API controllers). Android follows the existing Clean Architecture + MVVM pattern with Hilt DI. The Provider pattern abstracts platform-specific API differences behind a common interface.

## Complexity Tracking

No constitution violations to justify. The design extends existing patterns without introducing new architectural layers or excessive abstraction.
