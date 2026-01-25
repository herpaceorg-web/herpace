# Data Model - Hormone-Aware Training Plan System

**Date**: 2026-01-25
**Source**: Extracted from spec.md Key Entities and Functional Requirements

## Entity-Relationship Overview

```
User (1) ─────< (1) Runner
                    │
                    ├─────< (*) CycleLog
                    │
                    └─────< (*) Race
                              │
                              └─────< (0..1) TrainingPlan [active_plan constraint]
                                        │
                                        └─────< (*) TrainingSession
```

**Key Constraints**:
- One User → One Runner profile (1:1)
- One Runner → Many Races (1:*)
- One Race → Zero or One ACTIVE TrainingPlan (1:0..1) - enforced by unique constraint
- One Runner → Many Archived TrainingPlans (via Race) (1:*)
- One TrainingPlan → Many TrainingSessions (1:*)
- One Runner → Many CycleLogs (1:*)

---

## Core Entities

### 1. User

**Purpose**: Authentication and account management

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | UUID | PRIMARY KEY | Auto-generated |
| email | VARCHAR(255) | UNIQUE, NOT NULL | Login identifier |
| password_hash | VARCHAR(255) | NOT NULL | bcrypt hashed (NextAuth.js) |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Account creation |
| updated_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Last modified |
| deleted_at | TIMESTAMP | NULL | Soft delete for GDPR (30-day retention) |

**Relationships**:
- 1:1 → Runner (cascade delete)

**Indexes**:
- `idx_user_email` on email (login lookup)

---

### 2. Runner

**Purpose**: User health profile and training preferences (FR-001)

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | UUID | PRIMARY KEY | Auto-generated |
| user_id | UUID | FOREIGN KEY (User.id), UNIQUE, NOT NULL | One profile per user |
| fitness_level | ENUM('Beginner', 'Intermediate', 'Advanced', 'Elite') | NOT NULL | Self-reported (clarification: qualitative scale) |
| cycle_length | INTEGER | NULL, CHECK (cycle_length >= 21 AND cycle_length <= 45) | Days; NULL if cycle tracking opted out |
| last_period_start | DATE | NULL | Used for phase prediction; NULL if opted out |
| typical_cycle_regularity | ENUM('Regular', 'Irregular', 'DoNotTrack') | NOT NULL, DEFAULT 'Regular' | Affects prediction confidence |
| recent_race_time | VARCHAR(50) | NULL | Optional calibration (e.g., "10K in 55:30") |
| typical_weekly_mileage | DECIMAL(5,2) | NULL, CHECK (typical_weekly_mileage >= 0) | Optional calibration (km or miles, unit stored separately) |
| distance_unit | ENUM('km', 'miles') | NOT NULL, DEFAULT 'km' | User preference |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | |
| updated_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | |

**Relationships**:
- Many:1 → User
- 1:Many → Race
- 1:Many → CycleLog

**Indexes**:
- `idx_runner_user_id` on user_id (profile lookup)

**Privacy**: Strictly Private (all fields)

**Validation Rules** (from FR-001):
- `cycle_length` must be 21-45 days (medical standard)
- If `typical_cycle_regularity = 'DoNotTrack'`, `cycle_length` and `last_period_start` must be NULL

---

### 3. Race

**Purpose**: User's race goal anchoring a training plan (FR-002)

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | UUID | PRIMARY KEY | Auto-generated |
| runner_id | UUID | FOREIGN KEY (Runner.id), NOT NULL | Owner |
| race_name | VARCHAR(255) | NOT NULL | e.g., "London Marathon 2026" |
| race_date | DATE | NOT NULL, CHECK (race_date >= CURRENT_DATE + INTERVAL '7 days') | FR-016: min 1 week in future |
| distance | DECIMAL(6,2) | NOT NULL, CHECK (distance > 0) | In runner's distance_unit |
| distance_type | ENUM('5K', '10K', 'HalfMarathon', 'Marathon', 'Other') | NOT NULL | For template selection |
| goal_time | VARCHAR(50) | NULL | Optional (e.g., "3:30:00") |
| is_public | BOOLEAN | NOT NULL, DEFAULT FALSE | User-configurable privacy toggle |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | |
| updated_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | |

**Relationships**:
- Many:1 → Runner
- 1:0..1 → TrainingPlan (active)
- 1:Many → TrainingPlan (all - includes archived)

**Indexes**:
- `idx_race_runner_id` on runner_id (user's races)
- `idx_race_date` on race_date (upcoming races)

**Privacy**: User-configurable (is_public field)

**Validation Rules** (from FR-002, FR-016):
- `race_date` must be at least 7 days in future (enforced at API layer + DB constraint)
- `distance` must match `distance_type` (e.g., 5K = 5.0 km or 3.1 miles) - validated at API layer

---

### 4. TrainingPlan

**Purpose**: AI-generated or template-based training program (FR-003, FR-004)

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | UUID | PRIMARY KEY | Auto-generated |
| race_id | UUID | FOREIGN KEY (Race.id), NOT NULL | The race this plan targets |
| runner_id | UUID | FOREIGN KEY (Runner.id), NOT NULL | Denormalized for query efficiency |
| start_date | DATE | NOT NULL, DEFAULT CURRENT_DATE | Plan begins today (FR-004) |
| end_date | DATE | NOT NULL | Equals race_date from Race |
| status | ENUM('Active', 'Archived', 'Completed') | NOT NULL, DEFAULT 'Active' | FR-017: only 1 Active per runner |
| generation_source | ENUM('AI', 'Fallback') | NOT NULL | Tracks if AI or template (FR-015) |
| ai_model | VARCHAR(100) | NULL | e.g., "claude-3-5-sonnet-20241022" (if AI) |
| ai_rationale | TEXT | NULL | AI's overall plan reasoning (optional) |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Initial generation |
| updated_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Last regeneration (FR-010) |
| archived_at | TIMESTAMP | NULL | When archived (FR-018) |

**Relationships**:
- Many:1 → Race
- Many:1 → Runner
- 1:Many → TrainingSession

**Indexes**:
- `idx_training_plan_runner_status` on (runner_id, status) (enforce single active plan)
- `idx_training_plan_race_id` on race_id (plan lookup by race)

**Unique Constraints** (FR-017):
- `UNIQUE (runner_id, status) WHERE status = 'Active'` (PostgreSQL partial unique index)
  - Ensures only ONE active plan per runner
  - Allows multiple archived plans

**Privacy**: Private to user

**State Transitions** (FR-018):
1. **Active**: User can view, interact with sessions, regenerate
2. **Completed**: Race date has passed; plan auto-archived
3. **Archived**: User manually archived or race completed

**Validation Rules**:
- `end_date` must equal `race.race_date`
- `start_date` must be ≤ `end_date`
- Cannot create new Active plan if runner already has Active plan (enforced by unique constraint)

---

### 5. TrainingSession

**Purpose**: Individual workout within a training plan (FR-004, FR-008)

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | UUID | PRIMARY KEY | Auto-generated |
| training_plan_id | UUID | FOREIGN KEY (TrainingPlan.id), NOT NULL | Parent plan |
| scheduled_date | DATE | NOT NULL | When workout should be done |
| workout_type | ENUM('Easy', 'Long', 'Tempo', 'Interval', 'Rest') | NOT NULL | Clarified taxonomy |
| duration_minutes | INTEGER | NULL, CHECK (duration_minutes > 0) | NULL for Rest days |
| distance | DECIMAL(6,2) | NULL, CHECK (distance > 0) | In runner's distance_unit; NULL for Rest |
| intensity_level | ENUM('Low', 'Moderate', 'High') | NOT NULL | AI-suggested intensity |
| cycle_phase | ENUM('Follicular', 'Ovulatory', 'Luteal', 'Menstrual') | NULL | Predicted phase for this date |
| phase_guidance | TEXT | NULL | AI rationale for cycle-phase optimization (FR-011) |
| status | ENUM('Scheduled', 'Completed', 'Skipped', 'Modified') | NOT NULL, DEFAULT 'Scheduled' | User interaction (FR-008) |
| completed_at | TIMESTAMP | NULL | When user marked complete |
| user_notes | TEXT | NULL | User feedback (FR-008: "Felt great!") |
| skip_reason | ENUM('Sick', 'Injury', 'Life', 'Other') | NULL | If skipped (FR-008) |
| modified_from_type | ENUM('Easy', 'Long', 'Tempo', 'Interval', 'Rest') | NULL | Original type if modified |
| modified_from_duration | INTEGER | NULL | Original duration if modified |
| modified_from_intensity | ENUM('Low', 'Moderate', 'High') | NULL | Original intensity if modified |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | AI generation time |
| updated_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Last modification |

**Relationships**:
- Many:1 → TrainingPlan

**Indexes**:
- `idx_training_session_plan_date` on (training_plan_id, scheduled_date) (daily workout lookup)
- `idx_training_session_scheduled_date` on scheduled_date (today's workout query)
- `idx_training_session_status` on status (completed/skipped analysis)

**Privacy**: Private to user

**Validation Rules** (FR-008):
- If `status = 'Modified'`, at least one of `modified_from_*` fields must be non-NULL
- If `status = 'Completed'`, `completed_at` must be set
- If `status = 'Skipped'`, `skip_reason` should be set (optional but encouraged)
- `workout_type = 'Rest'` → `duration_minutes` and `distance` should be NULL

**State Transitions**:
1. **Scheduled** → Completed (user marks done)
2. **Scheduled** → Skipped (user skips)
3. **Scheduled** → Modified (user changes type/duration/intensity, then may complete)
4. **Modified** → Completed (user completes modified workout)

---

### 6. CycleLog

**Purpose**: User-logged cycle events for improved phase prediction (FR-012)

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | UUID | PRIMARY KEY | Auto-generated |
| runner_id | UUID | FOREIGN KEY (Runner.id), NOT NULL | Owner |
| log_date | DATE | NOT NULL | Date of logged event/symptom |
| event_type | ENUM('PeriodStart', 'Symptom', 'EnergyLevel') | NOT NULL | What is being logged |
| symptom | VARCHAR(100) | NULL | e.g., "Cramps", "Headache" (if event_type = Symptom) |
| energy_level | INTEGER | NULL, CHECK (energy_level BETWEEN 1 AND 5) | 1=Low, 5=High (if event_type = EnergyLevel) |
| notes | TEXT | NULL | Free-form user notes |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | |

**Relationships**:
- Many:1 → Runner

**Indexes**:
- `idx_cycle_log_runner_date` on (runner_id, log_date) (chronological logs)

**Privacy**: Highly Sensitive (Health Data) - HIPAA/GDPR compliance required

**Validation Rules** (FR-012):
- If `event_type = 'PeriodStart'`, update `runner.last_period_start` to `log_date`
- If `event_type = 'Symptom'`, `symptom` must be non-NULL
- If `event_type = 'EnergyLevel'`, `energy_level` must be non-NULL (1-5 scale)

**Usage** (FR-012, SC-005):
- PeriodStart logs update phase predictions in real-time
- EnergyLevel logs feed into AI plan regeneration (FR-010: "consistently logs lower energy during Luteal phase")
- Improves SC-005 target: 85%+ prediction accuracy

---

## Derived/Computed Values

These are NOT stored but calculated on-demand:

### Current Cycle Phase (for a given date)
```typescript
function getCurrentCyclePhase(runner: Runner, date: Date): CyclePhase | null {
  if (!runner.last_period_start || !runner.cycle_length) return null;

  const daysSinceLastPeriod = daysBetween(runner.last_period_start, date);
  const dayInCycle = (daysSinceLastPeriod % runner.cycle_length) + 1;

  if (dayInCycle >= 1 && dayInCycle <= 5) return 'Menstrual';
  if (dayInCycle >= 6 && dayInCycle <= 13) return 'Follicular';
  if (dayInCycle >= 14 && dayInCycle <= 15) return 'Ovulatory';
  if (dayInCycle >= 16) return 'Luteal';

  return null;
}
```

### Training Plan Progress (percentage)
```typescript
function getPlanProgress(plan: TrainingPlan): number {
  const totalDays = daysBetween(plan.start_date, plan.end_date);
  const daysPassed = daysBetween(plan.start_date, new Date());
  return Math.min(100, (daysPassed / totalDays) * 100);
}
```

### Workout Completion Rate (for analytics)
```typescript
function getCompletionRate(plan: TrainingPlan): number {
  const sessions = await TrainingSession.findAll({ where: { training_plan_id: plan.id } });
  const completed = sessions.filter(s => s.status === 'Completed').length;
  return (completed / sessions.length) * 100;
}
```

---

## Database Migrations Strategy

**Tools**: Prisma Migrate (TypeScript ORM with migration management)

**Migration Sequence** (for implementation):
1. `001_create_users_and_runners.sql` - User auth + Runner profiles
2. `002_create_races.sql` - Race goals
3. `003_create_training_plans.sql` - Plans + unique active constraint
4. `004_create_training_sessions.sql` - Workouts
5. `005_create_cycle_logs.sql` - Cycle tracking
6. `006_add_indexes.sql` - Performance indexes
7. `007_seed_fallback_templates.sql` - Seed data for template-based plans

**Rollback Strategy**: Each migration includes `DOWN` script for safe rollback

---

## Data Retention & GDPR Compliance

**User Data Retention** (from spec assumptions):
- Active accounts: Indefinite retention
- Deleted accounts: 30-day soft delete period (deleted_at timestamp)
- After 30 days: Hard delete all user data (cascade delete via foreign keys)

**Health Data (Cycle Logs)**:
- Encrypted at rest (PostgreSQL transparent data encryption)
- Access logged for HIPAA audit trail (audit table for CycleLog reads)
- User can request export (JSON download of all personal data)
- User can request deletion (triggers 30-day soft delete)

**Anonymization for Analytics**:
- Aggregate metrics (completion rates, average cycle length) use anonymized IDs
- No PII (email, names) in analytics exports

---

## Sample Data (for testing)

### Example Runner Profile
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "user_id": "650e8400-e29b-41d4-a716-446655440000",
  "fitness_level": "Intermediate",
  "cycle_length": 28,
  "last_period_start": "2026-01-15",
  "typical_cycle_regularity": "Regular",
  "recent_race_time": "10K in 55:30",
  "typical_weekly_mileage": 30.0,
  "distance_unit": "km"
}
```

### Example Training Session (Interval workout during Follicular phase)
```json
{
  "id": "750e8400-e29b-41d4-a716-446655440000",
  "training_plan_id": "850e8400-e29b-41d4-a716-446655440000",
  "scheduled_date": "2026-02-10",
  "workout_type": "Interval",
  "duration_minutes": 60,
  "distance": 10.0,
  "intensity_level": "High",
  "cycle_phase": "Follicular",
  "phase_guidance": "Your estrogen is rising during this phase, supporting muscle building and high-intensity efforts. Great time for speed work!",
  "status": "Scheduled"
}
```

---

## Summary

**Total Entities**: 6 (User, Runner, Race, TrainingPlan, TrainingSession, CycleLog)

**Total Fields**: 78 across all entities

**Key Constraints**:
- ✅ One active plan per runner (unique constraint + enum status)
- ✅ Race date minimum 7 days in future (check constraint)
- ✅ Cycle length 21-45 days (medical validity)
- ✅ Workout types limited to 5 types (enum)
- ✅ Cascade deletes for data consistency

**Next Steps**: Generate API contracts in `/contracts/` directory.
