# Quickstart Guide - HerPace Implementation

**Purpose**: Get developers started with implementing the Hormone-Aware Training Plan System
**Audience**: Frontend and backend developers joining the project
**Prerequisites**: Read [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md)

---

## Table of Contents

1. [Development Environment Setup](#development-environment-setup)
2. [Project Initialization](#project-initialization)
3. [Database Setup](#database-setup)
4. [Backend Implementation](#backend-implementation)
5. [Frontend Implementation](#frontend-implementation)
6. [Accessibility Implementation](#accessibility-implementation)
7. [AI Integration](#ai-integration)
8. [Testing Strategy](#testing-strategy)
9. [Deployment](#deployment)

---

## Development Environment Setup

### Required Tools

```bash
# Node.js 20 LTS
node --version  # Should be 20.x

# Package manager
npm --version   # Or yarn/pnpm

# PostgreSQL 15+
psql --version  # Should be 15.x or higher

# Git
git --version
```

### Recommended VS Code Extensions

- **ESLint**: Code quality
- **Prettier**: Code formatting
- **Prisma**: Database schema IntelliSense
- **Tailwind CSS IntelliSense**: CSS utilities
- **REST Client**: API testing
- **axe Accessibility Linter**: Accessibility checking

### Clone and Install

```bash
git clone <repo-url>
cd HerPaceApp
git checkout 001-hormone-aware-training

# Install dependencies (will install both frontend and backend)
npm install
```

---

## Project Initialization

### 1. Initialize Backend (Node.js + Express + Prisma)

```bash
cd backend
npm init -y
npm install express cors helmet bcrypt jsonwebtoken
npm install prisma @prisma/client
npm install --save-dev typescript @types/node @types/express ts-node-dev

# Initialize TypeScript
npx tsc --init

# Initialize Prisma
npx prisma init --datasource-provider postgresql
```

**backend/tsconfig.json**:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "lib": ["ES2022"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

### 2. Initialize Frontend (Next.js + TypeScript)

```bash
cd ../frontend
npx create-next-app@latest . --typescript --tailwind --app --no-src-dir

# Install additional dependencies
npm install next-auth @radix-ui/react-dialog @radix-ui/react-select
npm install date-fns axios
npm install --save-dev @axe-core/playwright
```

**frontend/next.config.js**:
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'
  }
}

module.exports = nextConfig
```

### 3. Create Shared Types

```bash
mkdir -p shared/types
```

**shared/types/index.ts** (generated from OpenAPI spec):
```bash
npx openapi-typescript ../specs/001-hormone-aware-training/contracts/api-spec.yaml \
  --output shared/types/api.ts
```

---

## Database Setup

### 1. Configure Prisma Schema

**backend/prisma/schema.prisma**:
```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id           String    @id @default(uuid())
  email        String    @unique
  passwordHash String    @map("password_hash")
  createdAt    DateTime  @default(now()) @map("created_at")
  updatedAt    DateTime  @updatedAt @map("updated_at")
  deletedAt    DateTime? @map("deleted_at")

  runner Runner?

  @@index([email])
  @@map("users")
}

model Runner {
  id                      String   @id @default(uuid())
  userId                  String   @unique @map("user_id")
  fitnessLevel            FitnessLevel @map("fitness_level")
  cycleLength             Int?     @map("cycle_length")
  lastPeriodStart         DateTime? @map("last_period_start") @db.Date
  typicalCycleRegularity  CycleRegularity @default(Regular) @map("typical_cycle_regularity")
  recentRaceTime          String?  @map("recent_race_time")
  typicalWeeklyMileage    Decimal? @map("typical_weekly_mileage") @db.Decimal(5, 2)
  distanceUnit            DistanceUnit @default(km) @map("distance_unit")
  createdAt               DateTime @default(now()) @map("created_at")
  updatedAt               DateTime @updatedAt @map("updated_at")

  user        User            @relation(fields: [userId], references: [id], onDelete: Cascade)
  races       Race[]
  trainingPlans TrainingPlan[]
  cycleLogs   CycleLog[]

  @@index([userId])
  @@map("runners")
}

enum FitnessLevel {
  Beginner
  Intermediate
  Advanced
  Elite
}

enum CycleRegularity {
  Regular
  Irregular
  DoNotTrack
}

enum DistanceUnit {
  km
  miles
}

// Continue with Race, TrainingPlan, TrainingSession, CycleLog models
// See data-model.md for full schema
```

### 2. Run Migrations

```bash
# Create .env file
echo "DATABASE_URL=postgresql://user:password@localhost:5432/herpace_dev" > .env

# Create database
createdb herpace_dev

# Generate migration
npx prisma migrate dev --name init

# Generate Prisma Client
npx prisma generate
```

### 3. Seed Test Data (Optional)

**backend/prisma/seed.ts**:
```typescript
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('password123', 10);

  const user = await prisma.user.create({
    data: {
      email: 'test@example.com',
      passwordHash,
      runner: {
        create: {
          fitnessLevel: 'Intermediate',
          cycleLength: 28,
          lastPeriodStart: new Date('2026-01-15'),
          typicalCycleRegularity: 'Regular',
          distanceUnit: 'km'
        }
      }
    }
  });

  console.log('Seed user created:', user.email);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

Run seed:
```bash
npx prisma db seed
```

---

## Backend Implementation

### 1. Project Structure

```
backend/
├── src/
│   ├── index.ts              # Express app entry point
│   ├── middleware/
│   │   ├── auth.ts           # JWT verification
│   │   └── errorHandler.ts  # Global error handling
│   ├── routes/
│   │   ├── auth.routes.ts    # POST /auth/signup, /auth/login
│   │   ├── profile.routes.ts # GET/POST/PATCH /profiles/me
│   │   ├── race.routes.ts    # CRUD /races
│   │   ├── plan.routes.ts    # /plans endpoints
│   │   ├── session.routes.ts # /sessions endpoints
│   │   └── cycle.routes.ts   # /cycle endpoints
│   ├── services/
│   │   ├── ai/
│   │   │   └── claudePlanGenerator.ts  # AI plan generation
│   │   ├── cycle/
│   │   │   └── phaseCalculator.ts      # Cycle phase prediction
│   │   ├── plan/
│   │   │   ├── planService.ts          # Plan CRUD, regeneration
│   │   │   └── planValidator.ts        # Single active plan check
│   │   └── fallback/
│   │       └── templatePlanGenerator.ts # Rule-based fallback
│   └── utils/
│       ├── jwt.ts            # Token generation/verification
│       └── validation.ts     # Input validation helpers
└── prisma/
    └── schema.prisma
```

### 2. Sample Implementation - Auth Middleware

**backend/src/middleware/auth.ts**:
```typescript
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
  userId?: string;
}

export const authenticateToken = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  jwt.verify(token, process.env.JWT_SECRET!, (err, decoded) => {
    if (err) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    req.userId = (decoded as any).userId;
    next();
  });
};
```

### 3. Sample Implementation - Cycle Phase Calculator

**backend/src/services/cycle/phaseCalculator.ts**:
```typescript
import { CyclePhase } from '@prisma/client';
import { differenceInDays } from 'date-fns';

export function calculateCurrentPhase(
  lastPeriodStart: Date,
  cycleLength: number,
  targetDate: Date
): CyclePhase | null {
  if (!lastPeriodStart || !cycleLength) return null;

  const daysSinceLastPeriod = differenceInDays(targetDate, lastPeriodStart);
  const dayInCycle = (daysSinceLastPeriod % cycleLength) + 1;

  if (dayInCycle >= 1 && dayInCycle <= 5) return 'Menstrual';
  if (dayInCycle >= 6 && dayInCycle <= 13) return 'Follicular';
  if (dayInCycle >= 14 && dayInCycle <= 15) return 'Ovulatory';
  if (dayInCycle >= 16) return 'Luteal';

  return null;
}

export function predictPhasesForRange(
  lastPeriodStart: Date,
  cycleLength: number,
  startDate: Date,
  endDate: Date
): Array<{ date: Date; phase: CyclePhase }> {
  const phases: Array<{ date: Date; phase: CyclePhase }> = [];
  let currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    const phase = calculateCurrentPhase(lastPeriodStart, cycleLength, currentDate);
    if (phase) {
      phases.push({ date: new Date(currentDate), phase });
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return phases;
}
```

---

## Frontend Implementation

### 1. Project Structure

```
frontend/
├── app/
│   ├── layout.tsx            # Root layout
│   ├── page.tsx              # Landing page
│   ├── auth/
│   │   ├── signup/page.tsx   # User Story 1 start
│   │   └── login/page.tsx
│   ├── onboarding/
│   │   ├── profile/page.tsx  # Runner profile setup
│   │   └── race/page.tsx     # Race goal entry
│   ├── dashboard/
│   │   └── page.tsx          # Today's workout (User Story 2)
│   ├── plan/
│   │   └── page.tsx          # Full plan view
│   └── settings/
│       └── cycle/page.tsx    # Cycle logging (User Story 3)
├── components/
│   ├── common/
│   │   ├── Button.tsx        # Accessible button
│   │   ├── Input.tsx         # Accessible form input
│   │   └── Select.tsx        # Accessible dropdown (Radix UI)
│   ├── plan/
│   │   ├── SessionCard.tsx   # Daily workout display
│   │   ├── PhaseIndicator.tsx # Cycle phase badge
│   │   └── PlanCalendar.tsx  # Weekly calendar view
│   └── cycle/
│       └── CycleLogForm.tsx  # Period/symptom logging
├── hooks/
│   ├── useAuth.ts            # Authentication state
│   ├── usePlan.ts            # Active plan data
│   └── useCycle.ts           # Cycle phase data
└── services/
    └── api.ts                # API client (axios)
```

### 2. Sample Implementation - API Client

**frontend/services/api.ts**:
```typescript
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor to add auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authAPI = {
  signup: (email: string, password: string) =>
    api.post('/auth/signup', { email, password }),
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password })
};

export const profileAPI = {
  getProfile: () => api.get('/profiles/me'),
  createProfile: (data: any) => api.post('/profiles/me', data),
  updateProfile: (data: any) => api.patch('/profiles/me', data)
};

export const planAPI = {
  getActivePlan: () => api.get('/plans/active'),
  createPlan: (raceId: string) => api.post('/plans', { raceId }),
  regeneratePlan: (planId: string, data: any) =>
    api.post(`/plans/${planId}`, data)
};

export const sessionAPI = {
  getTodaysWorkout: () => api.get('/sessions/today'),
  updateSession: (sessionId: string, data: any) =>
    api.patch(`/sessions/${sessionId}`, data)
};

export default api;
```

### 3. Sample Implementation - Today's Workout Component

**frontend/components/plan/SessionCard.tsx**:
```typescript
import { TrainingSession } from '@/types/api';

interface SessionCardProps {
  session: TrainingSession;
  onComplete: (notes?: string) => void;
  onSkip: (reason: string) => void;
  onModify: () => void;
}

export default function SessionCard({
  session,
  onComplete,
  onSkip,
  onModify
}: SessionCardProps) {
  return (
    <article
      className="bg-white rounded-lg shadow-md p-6"
      aria-labelledby="workout-title"
    >
      {/* Semantic HTML: article, headings, buttons */}
      <header className="mb-4">
        <h2 id="workout-title" className="text-2xl font-bold text-gray-900">
          {session.workoutType} Workout
        </h2>
        {session.cyclePhase && (
          <span
            className="inline-block mt-2 px-3 py-1 text-sm rounded-full bg-purple-100 text-purple-800"
            aria-label={`Cycle phase: ${session.cyclePhase}`}
          >
            {session.cyclePhase} Phase
          </span>
        )}
      </header>

      <div className="mb-4">
        <dl className="grid grid-cols-2 gap-4">
          <div>
            <dt className="text-sm font-medium text-gray-500">Duration</dt>
            <dd className="text-lg font-semibold text-gray-900">
              {session.durationMinutes} min
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Distance</dt>
            <dd className="text-lg font-semibold text-gray-900">
              {session.distance} km
            </dd>
          </div>
        </dl>

        {session.phaseGuidance && (
          <p className="mt-4 text-gray-700" aria-label="Workout guidance">
            💡 {session.phaseGuidance}
          </p>
        )}
      </div>

      {/* Accessible button group with keyboard navigation */}
      <div
        className="flex gap-3"
        role="group"
        aria-label="Workout action buttons"
      >
        <button
          onClick={() => onComplete()}
          className="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
          aria-label="Mark workout as complete"
        >
          Complete
        </button>
        <button
          onClick={onModify}
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          aria-label="Modify workout"
        >
          Modify
        </button>
        <button
          onClick={() => onSkip('Life')}
          className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
          aria-label="Skip workout"
        >
          Skip
        </button>
      </div>
    </article>
  );
}
```

---

## Accessibility Implementation

### Constitution Requirement: WCAG 2.1 Level AA Compliance

**Every component MUST follow these patterns:**

### 1. Semantic HTML

✅ **Good**:
```tsx
<nav aria-label="Main navigation">
  <ul>
    <li><a href="/dashboard">Dashboard</a></li>
  </ul>
</nav>

<main id="main-content">
  <h1>Your Training Plan</h1>
  <section aria-labelledby="today-workout">
    <h2 id="today-workout">Today's Workout</h2>
  </section>
</main>
```

❌ **Bad**:
```tsx
<div className="nav">
  <div onClick={() => navigate('/dashboard')}>Dashboard</div>
</div>
```

### 2. Keyboard Navigation

All interactive elements must be keyboard accessible:

```tsx
// Custom button component
export function Button({ onClick, children, ...props }: ButtonProps) {
  return (
    <button
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      className="focus:ring-2 focus:ring-blue-500 focus:outline-none"
      {...props}
    >
      {children}
    </button>
  );
}
```

### 3. ARIA Labels

```tsx
{/* Icon-only buttons MUST have aria-label */}
<button aria-label="Delete workout">
  <TrashIcon className="h-5 w-5" />
</button>

{/* Form inputs MUST have labels */}
<label htmlFor="cycle-length" className="block text-sm font-medium">
  Cycle Length (days)
</label>
<input
  id="cycle-length"
  type="number"
  min="21"
  max="45"
  aria-describedby="cycle-length-help"
/>
<p id="cycle-length-help" className="text-sm text-gray-500">
  Average length of your menstrual cycle
</p>
```

### 4. Color Contrast

Use Tailwind's high-contrast colors (4.5:1 minimum):

✅ **Good**: `text-gray-900 bg-white` (21:1 ratio)
✅ **Good**: `text-white bg-blue-600` (4.5:1 ratio)
❌ **Bad**: `text-gray-400 bg-white` (2.8:1 ratio - fails WCAG AA)

### 5. Focus Indicators

Always show visible focus state:

```tsx
className="focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none"
```

### 6. Screen Reader Testing

**Manual Testing Checklist**:
- [ ] NVDA (Windows): Navigate full onboarding flow with keyboard only
- [ ] JAWS (Windows): Complete/skip workout with screen reader
- [ ] VoiceOver (Mac/iOS): Navigate plan calendar

**Automated Testing**:
```typescript
// Playwright with axe-core
import { test, expect } from '@playwright/test';
import { injectAxe, checkA11y } from 'axe-playwright';

test('Dashboard page is accessible', async ({ page }) => {
  await page.goto('/dashboard');
  await injectAxe(page);
  await checkA11y(page);
});
```

### 7. Mobile Responsiveness

Test at minimum breakpoints (per SC-012):
- 360px width (mobile)
- 768px width (tablet)
- 1024px width (desktop)

```tsx
<div className="
  px-4 sm:px-6 lg:px-8        {/* Responsive padding */}
  text-sm sm:text-base lg:text-lg  {/* Responsive text */}
  grid grid-cols-1 md:grid-cols-2  {/* Responsive layout */}
">
```

---

## AI Integration

### 1. Anthropic Claude Setup

```bash
npm install @anthropic-ai/sdk
```

**backend/src/services/ai/claudePlanGenerator.ts**:
```typescript
import Anthropic from '@anthropic-ai/sdk';
import { Runner, Race } from '@prisma/client';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
});

export async function generateTrainingPlan(
  runner: Runner,
  race: Race,
  cyclePhases: Array<{ date: Date; phase: string }>
) {
  const prompt = buildPlanPrompt(runner, race, cyclePhases);

  try {
    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 4096,
      messages: [{
        role: 'user',
        content: prompt
      }],
      system: 'You are a professional running coach specializing in hormone-aware training for women. Generate training plans in JSON format.'
    });

    const planJSON = extractJSON(message.content);
    return validateAndParsePlan(planJSON); // FR-021 validation
  } catch (error) {
    console.error('AI plan generation failed:', error);
    throw new Error('AI_GENERATION_FAILED');
  }
}

function buildPlanPrompt(runner: Runner, race: Race, cyclePhases: any[]) {
  return `
Create a personalized running training plan with the following constraints:

**User Profile**:
- Fitness Level: ${runner.fitnessLevel}
- Typical Weekly Mileage: ${runner.typicalWeeklyMileage || 'Not provided'} ${runner.distanceUnit}
- Recent Race Performance: ${runner.recentRaceTime || 'Not provided'}

**Race Goal**:
- Race: ${race.raceName}
- Date: ${race.raceDate.toISOString().split('T')[0]}
- Distance: ${race.distance} ${runner.distanceUnit}
- Goal Time: ${race.goalTime || 'No specific goal'}

**Cycle Phases** (for optimization):
${cyclePhases.map(p => `- ${p.date.toISOString().split('T')[0]}: ${p.phase}`).join('\n')}

**Workout Types** (use ONLY these):
- Easy: Low intensity, conversational pace
- Long: Extended duration, endurance building
- Tempo: Moderate-hard, sustained effort
- Interval: High intensity intervals with recovery
- Rest: Complete rest day

**Cycle-Aware Guidelines**:
- Follicular Phase (Days 6-13): Schedule Interval and Tempo workouts (high energy, muscle building)
- Ovulatory Phase (Days 14-15): Peak performance window, quality work
- Luteal Phase (Days 16-28): Reduce intensity, more Easy runs
- Menstrual Phase (Days 1-5): Emphasize Easy and Rest (recovery focus)

**Response Format** (JSON):
{
  "planMetadata": {
    "totalWeeks": <number>,
    "weeklyMileageRange": "<low>-<high> ${runner.distanceUnit}"
  },
  "sessions": [
    {
      "scheduledDate": "YYYY-MM-DD",
      "workoutType": "Easy|Long|Tempo|Interval|Rest",
      "durationMinutes": <number or null for Rest>,
      "distance": <number or null for Rest>,
      "intensityLevel": "Low|Moderate|High",
      "cyclePhase": "Follicular|Ovulatory|Luteal|Menstrual",
      "phaseGuidance": "Brief tip for this workout given the cycle phase"
    },
    ...
  ]
}

Generate a complete training plan from today through race day, optimizing workout intensity based on predicted cycle phases.
`;
}
```

### 2. Fallback Template Generator

**backend/src/services/fallback/templatePlanGenerator.ts**:
```typescript
export function generateFallbackPlan(
  runner: Runner,
  race: Race
): TrainingPlan {
  const template = selectTemplate(race.distanceType, runner.fitnessLevel);
  const sessions = applyTemplate(template, race.raceDate, runner.distanceUnit);

  return {
    generationSource: 'Fallback',
    sessions,
    aiModel: null,
    aiRationale: 'Generated from template due to AI unavailability'
  };
}

function selectTemplate(distanceType: string, fitnessLevel: string) {
  // Load from templates/ JSON files
  return templates[`${distanceType}_${fitnessLevel}`];
}
```

---

## Testing Strategy

### 1. Unit Tests (Jest)

**backend/src/services/cycle/phaseCalculator.test.ts**:
```typescript
import { calculateCurrentPhase } from './phaseCalculator';

describe('Cycle Phase Calculator', () => {
  it('should return Follicular for day 10', () => {
    const lastPeriod = new Date('2026-01-01');
    const targetDate = new Date('2026-01-10');
    const phase = calculateCurrentPhase(lastPeriod, 28, targetDate);
    expect(phase).toBe('Follicular');
  });

  it('should return null if cycle tracking opted out', () => {
    const phase = calculateCurrentPhase(null, null, new Date());
    expect(phase).toBeNull();
  });
});
```

### 2. E2E Tests (Playwright)

**frontend/tests/e2e/user-story-1.spec.ts**:
```typescript
import { test, expect } from '@playwright/test';

test('User Story 1: Create Personalized Training Plan', async ({ page }) => {
  // Sign up
  await page.goto('/auth/signup');
  await page.fill('input[name="email"]', 'test@example.com');
  await page.fill('input[name="password"]', 'password123');
  await page.click('button[type="submit"]');

  // Create profile
  await page.waitForURL('/onboarding/profile');
  await page.selectOption('select[name="fitnessLevel"]', 'Intermediate');
  await page.fill('input[name="cycleLength"]', '28');
  await page.fill('input[name="lastPeriodStart"]', '2026-01-15');
  await page.click('button[type="submit"]');

  // Create race
  await page.waitForURL('/onboarding/race');
  await page.fill('input[name="raceName"]', 'London Marathon 2026');
  await page.fill('input[name="raceDate"]', '2026-04-26');
  await page.fill('input[name="distance"]', '42.2');
  await page.click('button[type="submit"]');

  // Verify plan generated
  await page.waitForURL('/dashboard');
  await expect(page.locator('text=Training Plan')).toBeVisible();
  await expect(page.locator('text=Follicular')).toBeVisible(); // Cycle phase indicator
});
```

### 3. Accessibility Tests (axe-core)

```typescript
test('Dashboard is accessible', async ({ page }) => {
  await page.goto('/dashboard');
  const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
  expect(accessibilityScanResults.violations).toEqual([]);
});
```

---

## Deployment

### Development

```bash
# Backend (port 3001)
cd backend
npm run dev

# Frontend (port 3000)
cd frontend
npm run dev
```

### Production (Vercel + Railway)

**1. Backend (Railway)**:
```bash
# Railway CLI
railway login
railway init
railway add postgresql
railway up
```

**2. Frontend (Vercel)**:
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
cd frontend
vercel --prod
```

**3. Environment Variables**:

Backend (.env):
```
DATABASE_URL=postgresql://...
JWT_SECRET=<random-secret>
ANTHROPIC_API_KEY=<your-key>
```

Frontend (.env.local):
```
NEXT_PUBLIC_API_URL=https://api.herpace.com/v1
NEXTAUTH_SECRET=<random-secret>
NEXTAUTH_URL=https://herpace.com
```

---

## Next Steps

1. ✅ Read this quickstart
2. ⬜ Set up development environment
3. ⬜ Initialize projects (backend + frontend)
4. ⬜ Implement User Story P1 (plan generation) first
5. ⬜ Run accessibility audit
6. ⬜ Deploy to staging
7. ⬜ Run Phase 2: Generate tasks.md with `/speckit.tasks`

**Questions?** Refer to:
- [spec.md](./spec.md) - User requirements
- [data-model.md](./data-model.md) - Database schema
- [contracts/api-spec.yaml](./contracts/api-spec.yaml) - API endpoints
- [research.md](./research.md) - Technology decisions

**Happy coding! 🚀**
