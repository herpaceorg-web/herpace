# Implementation Plan: Hormone-Aware Training Plan System

**Branch**: `001-hormone-aware-training` | **Date**: 2026-01-25 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-hormone-aware-training/spec.md`

**Note**: This plan uses Google Cloud infrastructure, Gemini AI, and .NET backend as requested for hackathon qualification.

## Summary

HerPace is a web-based fitness application for women that generates personalized, AI-powered training plans optimized around menstrual cycle phases. Users enter race goals and health information (including cycle data), receive tailored training plans with workouts (Easy, Long, Tempo, Interval, Rest), and can interact with daily workouts by completing, skipping, or modifying them. The system uses Google Gemini AI to create plans and adapts recommendations based on predicted cycle phases (Follicular, Ovulatory, Luteal, Menstrual) to optimize training intensity and recovery.

## Technical Context

**Language/Version**: C# 12, .NET 8.0 (backend + frontend via Blazor WebAssembly)
**Primary Dependencies**: ASP.NET Core Web API, Entity Framework Core 8, Google.Cloud.AIPlatform.V1, MudBlazor, ASP.NET Core Identity
**Storage**: Google Cloud SQL for PostgreSQL 15+ (managed, HIPAA-compliant)
**AI Integration**: Google Gemini 1.5 Pro via Vertex AI (primary, hackathon qualified), abstraction layer (IAIPlanGenerator interface) for Claude/GPT-4 (future)
**Testing**: xUnit (backend unit/integration), bUnit (Blazor components), Playwright + axe-core (E2E + accessibility)
**Target Platform**: Web (responsive design, mobile browsers min-width 360px, desktop browsers)
**Project Type**: Web application (frontend + backend API)
**Cloud Infrastructure**: Google Cloud Platform (Cloud Run for backend, Cloud SQL, Cloud Storage, Vertex AI)
**Performance Goals**:
  - Plan generation (AI + fallback) < 5 seconds (SC-007)
  - Page load < 3 seconds for core features
  - API response time < 200ms (p95)
**Constraints**:
  - 99% uptime for core features (SC-006)
  - WCAG 2.1 Level AA accessibility compliance (constitution)
  - HIPAA/GDPR compliance for health data (cycle information)
  - Mobile-responsive down to 360px width (SC-012)
  - Gemini AI required for hackathon qualification
**Scale/Scope**:
  - MVP: 100-1000 users
  - Long-term: 10k+ users
  - ~10-15 primary screens/pages
  - Training plans: 4-26 weeks (1 week minimum per FR-016)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### I. User-Centric Development ✅ PASS

**Evidence**:
- ✅ Feature spec includes 4 detailed user stories with Given-When-Then acceptance scenarios
- ✅ User Stories prioritized (P1-P4) based on core value proposition
- ✅ Independent testability confirmed for each story (spec includes "Independent Test" section)
- ✅ Success criteria are measurable and user-observable (15 measurable outcomes defined)
- ✅ Edge cases documented (9 edge cases with defined system behaviors)

**Verdict**: Fully compliant. All features are driven by user scenarios with clear acceptance criteria.

### II. Accessibility-First Design ✅ PASS (with plan requirement)

**Evidence**:
- ✅ Constitution requirement acknowledged (WCAG 2.1 Level AA in Technical Context constraints)
- ✅ Mobile responsiveness specified (360px min-width per SC-012)
- ⚠️ Semantic HTML, keyboard navigation, screen reader testing - **DEFERRED to Phase 1 design artifacts**

**Verdict**: PASS with requirement that Phase 1 design artifacts (quickstart.md, UI component design) include accessibility implementation notes (semantic HTML patterns, ARIA labels, keyboard navigation flows, color contrast requirements).

### III. Iterative Excellence ✅ PASS

**Evidence**:
- ✅ MVP approach confirmed (spec assumption: "MVP will be a web application")
- ✅ Features prioritized for iteration (P1: core plan generation → P2: workout interaction → P3: cycle logging → P4: plan updates)
- ✅ User feedback loop designed (SC-009: post-onboarding survey, SC-014: plan regeneration tracking)
- ✅ Testing philosophy aligned (constitution: early stage = manual testing; spec: tests not explicitly required for MVP)
- ✅ Independent value delivery per iteration (each user story delivers standalone value)

**Verdict**: Fully compliant. Development plan follows rapid iteration with early shipping and user feedback loops.

### Overall Gate Status: ✅ PASS

**Conditions**:
1. Phase 0 research MUST resolve all "NEEDS CLARIFICATION" items in Technical Context
2. Phase 1 design MUST include accessibility implementation guidance for UI components
3. Post-Phase 1 re-check MUST verify accessibility requirements are integrated into quickstart.md

**Proceed to Phase 0**: ✅ Authorized

## Project Structure

### Documentation (this feature)

```text
specs/001-hormone-aware-training/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
backend/
├── src/
│   ├── HerPace.API/              # ASP.NET Core Web API project
│   │   ├── Controllers/          # API endpoints
│   │   │   ├── AuthController.cs
│   │   │   ├── ProfileController.cs
│   │   │   ├── RaceController.cs
│   │   │   ├── PlanController.cs
│   │   │   ├── SessionController.cs
│   │   │   └── CycleController.cs
│   │   ├── Middleware/           # Auth, logging, error handling
│   │   ├── Program.cs            # Application entry point
│   │   └── appsettings.json      # Configuration
│   │
│   ├── HerPace.Core/             # Business logic & domain models
│   │   ├── Entities/             # Domain entities (Runner, Race, TrainingPlan, etc.)
│   │   ├── Interfaces/           # Service interfaces (IAIPlanGenerator, ICycleCalculator)
│   │   ├── Services/             # Business logic
│   │   │   ├── AI/               # AI plan generation (Gemini + abstraction)
│   │   │   ├── Cycle/            # Cycle phase prediction
│   │   │   ├── Plan/             # Plan generation, regeneration
│   │   │   └── Fallback/         # Template-based fallback
│   │   └── DTOs/                 # Data transfer objects
│   │
│   ├── HerPace.Infrastructure/   # Data access & external services
│   │   ├── Data/                 # EF Core DbContext, migrations
│   │   ├── Repositories/         # Data access repositories
│   │   ├── AI/                   # Gemini API client implementation
│   │   └── Google/               # GCP service integrations
│   │
│   └── HerPace.Tests/            # Unit & integration tests
│       ├── Unit/                 # xUnit tests for services
│       └── Integration/          # API integration tests
│
frontend/
├── src/                          # Frontend application (framework TBD)
│   ├── components/               # Reusable UI components
│   │   ├── common/               # Buttons, forms, inputs (accessible)
│   │   ├── plan/                 # Plan view, session cards, phase indicators
│   │   ├── profile/              # Profile forms
│   │   └── cycle/                # Cycle tracking UI
│   ├── pages/                    # Route-based pages
│   │   ├── auth/                 # Login, signup
│   │   ├── onboarding/           # Profile setup, race entry
│   │   ├── dashboard/            # Today's workout
│   │   ├── plan/                 # Plan view
│   │   └── settings/             # Cycle tracking, preferences
│   ├── services/                 # API client, state management
│   └── utils/                    # Date formatting, cycle calculations
│
shared/
└── contracts/                    # Shared API contracts (C# DTOs, OpenAPI spec)
```

**Structure Decision**: Web application structure selected based on:
- .NET Clean Architecture pattern (API → Core → Infrastructure separation)
- Google Cloud native deployment (Cloud Run containers for API, managed database)
- Frontend framework TBD in research phase (Blazor WebAssembly vs React/Angular)
- AI abstraction layer in Core for model flexibility (Gemini primary, swappable for Claude/GPT-4)

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

No constitutional violations. This section is not applicable.
