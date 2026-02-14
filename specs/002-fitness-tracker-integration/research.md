# Research: Fitness Tracker Integration

**Feature**: 002-fitness-tracker-integration
**Date**: 2026-02-11

## R-001: Strava OAuth 2.0 Integration Pattern

**Decision**: Use OAuth 2.0 Authorization Code flow with server-side token exchange and webhook subscriptions for real-time sync.

**Rationale**: Strava's API v3 is well-documented and mature. The Authorization Code flow is the standard for server-side apps and keeps tokens secure on the backend. Webhooks eliminate the need for polling and provide near-real-time activity notifications. Access tokens expire after 6 hours and require refresh token rotation.

**Alternatives considered**:
- *Client-side OAuth (implicit flow)*: Rejected — tokens would be exposed in the mobile app, less secure, and Strava doesn't recommend it.
- *Polling-only*: Rejected — would waste API rate limits (200/15min, 2,000/day) and introduce unnecessary latency.

**Key details**:
- OAuth scopes needed: `activity:read_all` (to read private activities), `profile:read_all` (for athlete identity)
- Webhook: One subscription per app covering all athletes. Payload contains metadata only (activity ID, athlete ID, event type). Must fetch full activity data via separate API call.
- Token storage: Access token, refresh token, token expiry, and athlete ID stored server-side in ConnectedService entity. Tokens encrypted at rest.
- Rate limits: 200 requests per 15 minutes, 2,000 per day. Token refresh calls don't count. Rate limit headers returned on every response.
- Activity data endpoint: `GET /api/v3/activities/{id}` for summary, `GET /api/v3/activities/{id}/streams` for time-series (HR, GPS, cadence, etc.)

## R-002: Health Connect Integration Architecture

**Decision**: Use the Health Connect Jetpack SDK for on-device data reading in the Android app, with background sync via WorkManager to push data to the HerPace backend.

**Rationale**: Health Connect is Android's native health data hub (replacing deprecated Google Fit). It provides on-device access to data from all wearables that sync with Android (Garmin, Fitbit, Samsung, Polar, etc.). No cloud API exists — data must be read from the Android device and synced to the backend.

**Alternatives considered**:
- *Google Fit REST API*: Rejected — deprecated (no new signups since May 2024, shutting down 2026). Health Connect is the official replacement.
- *Direct wearable APIs per brand*: Rejected — Health Connect aggregates all brands on-device, eliminating the need for per-brand integrations on Android.

**Key details**:
- SDK: `androidx.health.connect:connect-client:1.1.0` (stable)
- Permissions: Granular per-data-type (`READ_EXERCISE`, `READ_HEART_RATE`, `READ_DISTANCE`, `READ_SPEED`, `READ_STEPS`, `READ_ELEVATION_GAINED`, `READ_EXERCISE_ROUTE`)
- Data types: `ExerciseSessionRecord` (with `EXERCISE_TYPE_RUNNING` and `EXERCISE_TYPE_RUNNING_TREADMILL`), `HeartRateRecord`, `DistanceRecord`, `SpeedRecord`, `ElevationGainedRecord`, `StepsCadenceRecord`
- Sync pattern: Read on app open + periodic WorkManager job. Query by time range since last sync.
- No webhook/push mechanism — must poll the on-device store.
- Minimum Android SDK 28 (Pie). Health Connect app must be installed on device.

## R-003: Garmin Developer Program Integration

**Decision**: Apply for Garmin Connect Developer Program and implement cloud-to-cloud integration using their Activity API and Women's Health API. This is a longer-term integration (P3) due to the approval process.

**Rationale**: Garmin offers the richest data for runners (full FIT files, detailed metrics) and uniquely provides a Women's Health API for menstrual cycle data — directly relevant to HerPace's core value proposition. The Training API also enables pushing workouts to Garmin devices (future feature). Requires business application and approval.

**Alternatives considered**:
- *Strava-only for Garmin users*: Rejected long-term — loses access to women's health data and detailed FIT file metrics. Acceptable short-term while awaiting Garmin approval.
- *Third-party aggregator (Terra API, Spike)*: Rejected — adds external dependency and cost, and aggregators don't support Garmin's Women's Health API.

**Key details**:
- Authentication: OAuth 2.0 with PKCE, cloud-to-cloud
- Data delivery: Push model (Garmin sends data to our endpoint) or Ping/Pull model
- Activity API: JSON summaries + FIT/GPX/TCX file downloads
- Women's Health API: Menstrual cycle schedules and cycle details
- Training API (future): Push structured workouts to Garmin devices
- Rate limits: Managed by Garmin, communicated during onboarding
- Contact: `connect-support@developer.garmin.com`

## R-004: Duplicate Detection Strategy

**Decision**: Detect duplicates using a composite key of activity start time (within 1-minute tolerance) and distance (within 1% tolerance). First-imported record is canonical.

**Rationale**: Most duplicate scenarios arise when users connect both Strava and Health Connect (or Garmin), and the same watch-recorded run appears in both. Start time + distance provides high-accuracy matching without requiring GPS comparison (which would be computationally expensive and fragile across platforms).

**Alternatives considered**:
- *External ID matching*: Rejected — different platforms use different IDs for the same activity, with no cross-reference.
- *GPS route comparison*: Rejected — too computationally expensive, GPS precision varies across platforms, and not all runs have GPS data.
- *User-assisted dedup*: Rejected for initial import — too much friction. Could be added later as a "merge" feature.

**Key details**:
- Compare: `abs(startTimeA - startTimeB) < 60 seconds AND abs(distanceA - distanceB) / max(distanceA, distanceB) < 0.01`
- Also check duration as a secondary signal: `abs(durationA - durationB) / max(durationA, durationB) < 0.05` (5% tolerance)
- If duplicate detected, silently discard the later import
- Log duplicate detections in SyncLog for monitoring

## R-005: Activity-to-TrainingSession Matching

**Decision**: Match imported activities to scheduled TrainingSession records by date (same calendar day) and workout type compatibility. Unmatched activities remain standalone.

**Rationale**: Training sessions are scheduled by date. A run imported on the same day as a scheduled session is very likely the execution of that session. Matching by date + type compatibility (e.g., an imported run matches a scheduled Easy/Long/Tempo/Interval session but not a Rest day) provides reliable linking without requiring user confirmation.

**Alternatives considered**:
- *User-confirmed matching*: Rejected for MVP — adds friction to every import. Could be offered as an override.
- *Distance-based matching*: Rejected — planned distances are targets, not exact values. Users routinely run slightly more or less than planned.
- *No matching (display-only)*: Rejected — clarification confirmed that imported data should feed into AI plan adjustments, which requires matching.

**Key details**:
- Match criteria: Same calendar day + TrainingSession has WorkoutType != Rest + TrainingSession not already completed
- If multiple sessions on same day (unlikely but possible), prefer the one closest in workout type
- Mark matched session as completed when import is linked, using imported actual distance/duration
- If session was already manually completed, do not overwrite — keep both records

## R-006: Token Security and Storage

**Decision**: Store OAuth tokens encrypted in the database (backend) and in EncryptedSharedPreferences (Android). Never expose tokens to the frontend.

**Rationale**: OAuth tokens are sensitive credentials. The backend handles all token exchange, refresh, and API calls to external services. The Android app only stores Health Connect state (which uses on-device permissions, not tokens). This follows the existing pattern where JWT tokens are handled server-side.

**Key details**:
- Backend: Encrypt access_token and refresh_token columns using EF Core value converters with AES-256
- Token refresh: Background job checks for tokens expiring within 1 hour and proactively refreshes
- Android: Health Connect uses Android permission system (no tokens). Strava/Garmin OAuth flows redirect through the backend.
- Frontend: Never handles or stores external service tokens. Only displays connection status from the API.

## R-007: Webhook Infrastructure for Strava

**Decision**: Implement a webhook endpoint on the backend API to receive Strava event notifications. Process events asynchronously using a background job queue.

**Rationale**: Strava webhooks provide near-real-time notifications when athletes create, update, or delete activities. The webhook payload is minimal (just IDs and event type), so the actual data fetch happens in a background job using the stored access token.

**Key details**:
- Endpoint: `POST /api/webhooks/strava` (public, no JWT auth — validated via Strava's verification)
- Subscription validation: `GET /api/webhooks/strava` must echo back `hub.challenge` from Strava
- Event processing: Queue a background job (Hangfire) to fetch the full activity using the athlete's stored token
- One subscription per app (not per user) — events include `owner_id` to identify the athlete
- Handle `activity.create` events for new imports; ignore `activity.update` (per clarification: snapshots only)
- Handle `athlete.deauthorize` events to mark the ConnectedService as disconnected

## R-008: Aggregator APIs Assessment

**Decision**: Do not use third-party aggregator APIs (Terra, Spike, Thryve). Integrate directly with each platform.

**Rationale**: Aggregator APIs add an external dependency, ongoing cost, and a single point of failure. They also don't support Garmin's Women's Health API, which is a key differentiator for HerPace. Direct integration provides full control, no per-user fees, and access to all platform-specific features.

**Alternatives considered**:
- *Terra API*: Covers many platforms (Garmin, COROS, Polar, Suunto, Fitbit) behind a single API. Saves development time but adds monthly cost, limits data access to what Terra exposes, and doesn't support Women's Health API.
- *Spike API*: Similar to Terra. Less mature.
- *Open Wearables*: Open-source option. Immature, limited support.
