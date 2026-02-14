# Data Model: Fitness Tracker Integration

**Feature**: 002-fitness-tracker-integration
**Date**: 2026-02-11

## Entity Relationship Diagram

```text
Runner (1) ─────── (many) ConnectedService
                              │
                              └── (many) SyncLog

Runner (1) ─────── (many) ImportedActivity ─── (0..1) TrainingSession
                              │
                              └── source: ConnectedService (via FitnessPlatform)
```

### Integration with Existing Model

```text
User (1) ──── (1) Runner
                    ├── (many) Race ──── (0..1) TrainingPlan ──── (many) TrainingSession
                    ├── (many) TrainingPlan                              ↑
                    ├── (many) ConnectedService                          │ (optional link)
                    └── (many) ImportedActivity ─────────────────────────┘
```

## New Entities

### ConnectedService

Represents a user's authenticated connection to an external fitness platform.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| Id | GUID | PK | Unique identifier |
| RunnerId | GUID | FK → Runner, NOT NULL | Owning runner |
| Platform | Enum (FitnessPlatform) | NOT NULL | Strava, HealthConnect, Garmin |
| Status | Enum (ConnectionStatus) | NOT NULL, default: Connected | Connected, Disconnected, TokenExpired, Error |
| ExternalUserId | String | nullable | Platform-specific user/athlete ID |
| AccessToken | String (encrypted) | nullable | OAuth access token (null for Health Connect) |
| RefreshToken | String (encrypted) | nullable | OAuth refresh token (null for Health Connect) |
| TokenExpiresAt | DateTime | nullable | When the access token expires |
| Scopes | String | nullable | Granted OAuth scopes (comma-separated) |
| ConnectedAt | DateTime | NOT NULL | When the connection was established |
| DisconnectedAt | DateTime | nullable | When the connection was revoked |
| LastSyncAt | DateTime | nullable | Last successful activity sync |
| LastSyncError | String | nullable | Error message from last failed sync |
| CreatedAt | DateTime | NOT NULL | Record creation timestamp |
| UpdatedAt | DateTime | NOT NULL | Last modification timestamp |

**Validation rules**:
- Unique constraint on (RunnerId, Platform) — one connection per platform per runner
- AccessToken and RefreshToken encrypted at rest (AES-256 via EF Core value converter)
- Health Connect records have null tokens (uses on-device Android permissions)

**State transitions**:
```text
[None] → Connected          (user completes OAuth or grants permissions)
Connected → TokenExpired     (access token expires and refresh fails)
TokenExpired → Connected     (user re-authorizes)
Connected → Disconnected     (user disconnects from HerPace)
Connected → Error            (unexpected API error persists)
Error → Connected            (user re-authorizes or error resolves)
Disconnected → Connected     (user reconnects)
```

### ImportedActivity

Represents a running activity imported from an external fitness service.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| Id | GUID | PK | Unique identifier |
| RunnerId | GUID | FK → Runner, NOT NULL | Owning runner |
| Platform | Enum (FitnessPlatform) | NOT NULL | Source platform |
| ExternalActivityId | String | NOT NULL | Platform-specific activity ID |
| TrainingSessionId | GUID | FK → TrainingSession, nullable | Matched training session (if any) |
| ActivityDate | DateTime | NOT NULL | When the activity occurred (start time) |
| ActivityType | String | NOT NULL | e.g., "Run", "TreadmillRun" |
| DistanceMeters | Double | nullable | Total distance in meters |
| DurationSeconds | Int | nullable | Total duration in seconds |
| MovingTimeSeconds | Int | nullable | Moving time (excluding pauses) |
| AveragePaceSecondsPerKm | Double | nullable | Average pace in seconds per kilometer |
| AverageHeartRate | Int | nullable | Average heart rate in BPM |
| MaxHeartRate | Int | nullable | Maximum heart rate in BPM |
| Cadence | Int | nullable | Average cadence (steps per minute) |
| ElevationGainMeters | Double | nullable | Total elevation gain in meters |
| CaloriesBurned | Int | nullable | Estimated calories burned |
| GpsRouteJson | String (JSON) | nullable | GPS route data as JSON array of [lat, lng, altitude?] |
| ActivityTitle | String | nullable | Activity name/title from source platform |
| RawResponseJson | String (JSON) | nullable | Full API response for debugging (optional, can be purged) |
| ImportedAt | DateTime | NOT NULL | When this record was imported |
| CreatedAt | DateTime | NOT NULL | Record creation timestamp |

**Validation rules**:
- Unique constraint on (Platform, ExternalActivityId) — prevents duplicate imports from same source
- ActivityType must be "Run" or "TreadmillRun" (other types filtered during import)
- All measurement fields use metric units (meters, seconds, BPM) for internal consistency
- GpsRouteJson validated as valid JSON array if present

**Indexes**:
- (RunnerId, ActivityDate) — for querying activities by date range
- (Platform, ExternalActivityId) — unique, for duplicate detection
- (RunnerId, Platform) — for filtering by source
- (TrainingSessionId) — for looking up linked sessions

### SyncLog

Tracks synchronization events for auditing, troubleshooting, and monitoring.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| Id | GUID | PK | Unique identifier |
| ConnectedServiceId | GUID | FK → ConnectedService, NOT NULL | Which connection triggered this sync |
| RunnerId | GUID | FK → Runner, NOT NULL | Owning runner |
| Platform | Enum (FitnessPlatform) | NOT NULL | Platform synced |
| SyncType | String | NOT NULL | "initial", "webhook", "manual", "background" |
| StartedAt | DateTime | NOT NULL | When sync started |
| CompletedAt | DateTime | nullable | When sync completed (null if in-progress or failed) |
| ActivitiesFound | Int | default: 0 | Total activities found in source |
| ActivitiesImported | Int | default: 0 | New activities successfully imported |
| ActivitiesDuplicate | Int | default: 0 | Activities skipped as duplicates |
| ActivitiesFiltered | Int | default: 0 | Activities skipped (non-running) |
| Success | Bool | NOT NULL | Whether sync completed successfully |
| ErrorMessage | String | nullable | Error details if failed |
| ErrorCode | String | nullable | Categorized error code (e.g., "TOKEN_EXPIRED", "RATE_LIMITED", "SERVICE_UNAVAILABLE") |

**Retention**: SyncLog entries older than 90 days may be archived or purged.

## New Enums

### FitnessPlatform

| Value | Int | Description |
|-------|-----|-------------|
| Strava | 0 | Strava cloud API |
| HealthConnect | 1 | Android Health Connect on-device |
| Garmin | 2 | Garmin Connect cloud API |

### ConnectionStatus

| Value | Int | Description |
|-------|-----|-------------|
| Connected | 0 | Active and syncing |
| Disconnected | 1 | User disconnected |
| TokenExpired | 2 | OAuth token expired, needs re-auth |
| Error | 3 | Persistent error state |

## Existing Entity Modifications

### TrainingSession (existing — no schema changes)

No new columns needed. The `ImportedActivity.TrainingSessionId` FK creates the link. When an imported activity is matched:
- `CompletedAt` is set to the activity's timestamp
- `ActualDistance` is set from `ImportedActivity.DistanceMeters` (converted to appropriate unit)
- `ActualDuration` is set from `ImportedActivity.DurationSeconds`

This reuses the existing completion tracking fields rather than adding new ones.

## Duplicate Detection Logic

```text
For each candidate activity from source:
  1. Check exact match: SELECT * FROM ImportedActivity
     WHERE Platform = @platform AND ExternalActivityId = @externalId
     → If found: skip (same source, already imported)

  2. Check cross-platform duplicate: SELECT * FROM ImportedActivity
     WHERE RunnerId = @runnerId
       AND ABS(EXTRACT(EPOCH FROM ActivityDate - @activityDate)) < 60
       AND ABS(DistanceMeters - @distance) / GREATEST(DistanceMeters, @distance) < 0.01
     → If found: skip (duplicate from different source, first-imported wins)

  3. No match: import as new ImportedActivity
```

## Activity-to-Session Matching Logic

```text
For each newly imported activity:
  1. Find candidate sessions: SELECT * FROM TrainingSession ts
     JOIN TrainingPlan tp ON ts.TrainingPlanId = tp.Id
     WHERE tp.RunnerId = @runnerId
       AND ts.ScheduledDate = @activityDate::date
       AND ts.WorkoutType != 'Rest'
       AND ts.CompletedAt IS NULL

  2. If exactly one candidate: link ImportedActivity.TrainingSessionId = session.Id
     and mark session completed with imported metrics

  3. If multiple candidates: select the first uncompleted session on that day
     (deterministic tie-breaking)

  4. If no candidates: ImportedActivity remains standalone (no TrainingSessionId)
```
