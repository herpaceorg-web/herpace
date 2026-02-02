# Repository Guidelines

## Project Structure & Module Organization
- `backend/` contains the .NET solution: `src/HerPace.API` (controllers, middleware, DI), `src/HerPace.Core` (entities, DTOs, interfaces, enums), and `src/HerPace.Infrastructure` (EF Core DbContext, services, AI integration, migrations).
- `backend/tests/HerPace.Tests` holds xUnit tests.
- `frontend/` is the React + Vite app. Key folders are `src/pages`, `src/components`, `src/contexts`, `src/hooks`, `src/schemas`, `src/types`, and `src/utils`.
- `specs/` stores product specs and research documents.
- Root scripts (e.g., `deploy-*.ps1`) support deployment and maintenance.

## Build, Test, and Development Commands
Backend (run from repo root):
- `dotnet build HerPace.sln` builds the full solution.
- `dotnet run --project backend/src/HerPace.API` runs the API (default port 7001).
- `dotnet test HerPace.sln` runs all backend tests.

Frontend (run from `frontend/`):
- `npm install` installs dependencies.
- `npm run dev` starts the Vite dev server (default port 5163).
- `npm run build` creates a production build.

## Coding Style & Naming Conventions
- C#: follow .NET conventions (PascalCase for types/methods, camelCase for locals). Interfaces use `I*` (e.g., `IPlanGenerationService`).
- TypeScript/React: use PascalCase for components (e.g., `Signup.tsx`), camelCase for hooks/utility functions (e.g., `useOnboardingCheck`).
- Linting: frontend uses ESLint with TypeScript + React hooks rules (`frontend/eslint.config.js`).

## Testing Guidelines
- Backend tests use xUnit (`backend/tests/HerPace.Tests`). Keep test classes named `*Tests` and test files `*Tests.cs`.
- Run tests with `dotnet test HerPace.sln`. There is no explicit coverage threshold configured.
- No dedicated frontend test suite is present; add one if introducing complex UI logic.

## Commit & Pull Request Guidelines
- Use short, imperative commit summaries consistent with history (e.g., “Fix date issues”, “Add in onboarding”).
- PRs should include: a clear description, linked issues/specs when relevant, test commands run, and screenshots for UI changes.

## Security & Configuration Tips
- Do not commit secrets. Backend secrets are injected via environment variables; `appsettings.Production.json` must remain non-sensitive.
- Frontend configuration uses `VITE_`-prefixed env vars (see `frontend/.env.*` if present).
