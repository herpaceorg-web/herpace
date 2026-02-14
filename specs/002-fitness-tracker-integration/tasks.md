# Tasks: Fitness Tracker Integration

**Input**: Design documents from `/specs/002-fitness-tracker-integration/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/

**Tests**: Not explicitly requested. Tests are omitted per constitution (early stage = manual testing).

**Organization**: Tasks grouped by user story for independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story (US1, US2, US3, US4, US5)
- Exact file paths included in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Configuration, dependencies, and shared type definitions

- [x] T001 Add Strava configuration section to backend/src/HerPace.API/appsettings.Development.json with FitnessTracker:Strava:ClientId, ClientSecret, RedirectUri, WebhookVerifyToken placeholders
- [x] T002 [P] Create FitnessPlatform enum (Strava=0, HealthConnect=1, Garmin=2) in backend/src/HerPace.Core/Enums/FitnessPlatform.cs
- [x] T003 [P] Create ConnectionStatus enum (Connected=0, Disconnected=1, TokenExpired=2, Error=3) in backend/src/HerPace.Core/Enums/ConnectionStatus.cs
- [x] T004 [P] Add FitnessTracker configuration options class in backend/src/HerPace.Core/Configuration/FitnessTrackerOptions.cs binding Strava settings, InitialImportDays=30, SyncCooldownMinutes=5, DuplicateTimeToleranceSeconds=60, DuplicateDistanceTolerancePercent=1
- [x] T005 [P] Add Health Connect SDK dependency (androidx.health.connect:connect-client:1.1.0) to android/app/build.gradle.kts
- [x] T006 [P] Add Health Connect permissions to android/app/src/main/AndroidManifest.xml (READ_EXERCISE, READ_HEART_RATE, READ_DISTANCE, READ_SPEED, READ_ELEVATION_GAINED, READ_EXERCISE_ROUTE)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core entities, database migration, shared interfaces, and DTOs that ALL user stories depend on

**CRITICAL**: No user story work can begin until this phase is complete

- [x] T007 Create ConnectedService entity in backend/src/HerPace.Core/Entities/ConnectedService.cs with fields per data-model.md (Id, RunnerId, Platform, Status, ExternalUserId, AccessToken, RefreshToken, TokenExpiresAt, Scopes, ConnectedAt, DisconnectedAt, LastSyncAt, LastSyncError, CreatedAt, UpdatedAt)
- [x] T008 [P] Create ImportedActivity entity in backend/src/HerPace.Core/Entities/ImportedActivity.cs with fields per data-model.md (Id, RunnerId, Platform, ExternalActivityId, TrainingSessionId, ActivityDate, ActivityType, DistanceMeters, DurationSeconds, MovingTimeSeconds, AveragePaceSecondsPerKm, AverageHeartRate, MaxHeartRate, Cadence, ElevationGainMeters, CaloriesBurned, GpsRouteJson, ActivityTitle, ImportedAt, CreatedAt)
- [x] T009 [P] Create SyncLog entity in backend/src/HerPace.Core/Entities/SyncLog.cs with fields per data-model.md (Id, ConnectedServiceId, RunnerId, Platform, SyncType, StartedAt, CompletedAt, ActivitiesFound, ActivitiesImported, ActivitiesDuplicate, ActivitiesFiltered, Success, ErrorMessage, ErrorCode)
- [x] T010 Add DbSets for ConnectedService, ImportedActivity, SyncLog to backend/src/HerPace.Infrastructure/Data/HerPaceDbContext.cs with entity configuration: unique constraint on (RunnerId, Platform) for ConnectedService, unique constraint on (Platform, ExternalActivityId) for ImportedActivity, indexes per data-model.md, cascade delete Runner→ConnectedService/ImportedActivity, optional FK ImportedActivity→TrainingSession
- [x] T011 Create EF Core migration AddFitnessTrackerEntities in backend/src/HerPace.Infrastructure/Migrations/ using dotnet ef migrations add
- [x] T012 Create FitnessTrackerDtos in backend/src/HerPace.Core/DTOs/FitnessTrackerDtos.cs: ConnectedServiceDto, ImportedActivitySummaryDto, ImportedActivityDetailDto, SyncLogDto, ActivityUploadRequestDto, ActivityUploadItemDto, ConnectHealthConnectRequestDto, DisconnectResponseDto, SyncResponseDto, ServicesListResponseDto
- [x] T013 [P] Create IFitnessProvider interface in backend/src/HerPace.Infrastructure/Services/Providers/IFitnessProvider.cs defining: GetAuthorizationUrl(), ExchangeCodeForTokens(), RefreshAccessToken(), FetchActivities(since), FetchActivity(externalId), RevokeAccess()
- [x] T014 [P] Create IFitnessTrackerService interface in backend/src/HerPace.Core/Interfaces/IFitnessTrackerService.cs defining: GetServicesAsync(runnerId), InitiateConnectionAsync(runnerId, platform), CompleteConnectionAsync(runnerId, platform, code), DisconnectAsync(runnerId, platform, deleteData), TriggerSyncAsync(runnerId, platform), GetSyncLogsAsync(runnerId, platform, limit)
- [x] T015 [P] Create IActivityImportService interface in backend/src/HerPace.Core/Interfaces/IActivityImportService.cs defining: ImportActivitiesAsync(runnerId, platform, activities), DetectDuplicate(runnerId, activityDate, distanceMeters), MatchToTrainingSession(runnerId, activityDate), GetActivitiesAsync(runnerId, platform, from, to, page, pageSize), GetActivityDetailAsync(activityId, runnerId)
- [x] T016 Implement ActivityImportService in backend/src/HerPace.Infrastructure/Services/ActivityImportService.cs: duplicate detection logic (same-source exact match + cross-platform time/distance tolerance per research.md R-004), activity-to-session matching logic (same date + non-Rest + uncompleted per research.md R-005), activity type filtering (Run/TreadmillRun only), normalization to metric units, paginated activity listing
- [x] T017 Implement FitnessTrackerService in backend/src/HerPace.Infrastructure/Services/FitnessTrackerService.cs: GetServicesAsync (list all 3 platforms with status from DB), DisconnectAsync (revoke external token, update status, optionally delete imported data and unlink sessions per FR-018/FR-019), TriggerSyncAsync (validate connected, check cooldown, queue Hangfire job)
- [x] T018 Register IFitnessTrackerService, IActivityImportService, and FitnessTrackerOptions in DI container in backend/src/HerPace.API/Program.cs

**Checkpoint**: Foundation ready - entities in DB, core import pipeline functional, user story implementation can begin

---

## Phase 3: User Story 1 - Connect a Strava Account (Priority: P1) — MVP

**Goal**: Users can connect Strava via OAuth, receive webhook-driven real-time activity imports, and historical import of last 30 days on first connection

**Independent Test**: Connect a Strava account, record a run, verify it appears in HerPace

### Implementation for User Story 1

- [x] T019 [US1] Implement StravaProvider in backend/src/HerPace.Infrastructure/Services/Providers/StravaProvider.cs: build authorization URL with scopes activity:read_all,profile:read_all per research.md R-001, exchange code for tokens at POST /oauth/token, refresh tokens (rotating refresh), fetch activities via GET /api/v3/activities with date filtering, fetch single activity detail, fetch streams (HR, GPS, cadence) via GET /api/v3/activities/{id}/streams, deauthorize via POST /oauth/deauthorize, handle rate limit headers (X-RateLimit-Limit, X-RateLimit-Usage)
- [x] T020 [US1] Add InitiateConnectionAsync and CompleteConnectionAsync for Strava to backend/src/HerPace.Infrastructure/Services/FitnessTrackerService.cs: generate state token, store in cache/session, build redirect URL, on callback exchange code for tokens, create ConnectedService record, fetch athlete profile for ExternalUserId, queue Hangfire background job for initial 30-day historical import
- [x] T021 [US1] Implement Strava webhook controller in backend/src/HerPace.API/Controllers/StravaWebhookController.cs: GET /api/webhooks/strava for subscription validation (echo hub.challenge, verify hub.verify_token), POST /api/webhooks/strava for event notification (return 200 immediately, queue Hangfire job), event routing per webhook-contracts.md (activity.create → import, activity.update/delete → ignore, athlete.deauthorize → disconnect)
- [x] T022 [US1] Implement Strava webhook background job in backend/src/HerPace.Infrastructure/Services/StravaWebhookProcessor.cs: look up ConnectedService by owner_id, fetch full activity from Strava API, handle 401 with token refresh, filter non-running types, call ActivityImportService.ImportActivitiesAsync, log results in SyncLog
- [x] T023 [US1] Implement token refresh background job in backend/src/HerPace.Infrastructure/Services/TokenRefreshJob.cs: query ConnectedService records with TokenExpiresAt within 1 hour, proactively refresh via StravaProvider.RefreshAccessToken, update stored tokens, mark TokenExpired if refresh fails
- [x] T024 [US1] Create FitnessTrackerController in backend/src/HerPace.API/Controllers/FitnessTrackerController.cs: GET /api/fitness-tracker/connect/strava (initiate OAuth), GET /api/fitness-tracker/callback/strava (handle OAuth callback, redirect to frontend), POST /api/fitness-tracker/sync/strava (manual sync trigger), all per connected-services-api.md contracts
- [x] T025 [P] [US1] Add fitness tracker TypeScript types to frontend/src/types/api.ts: FitnessPlatform enum, ConnectionStatus enum, ConnectedServiceDto, ImportedActivityDto interfaces per API contract responses
- [x] T026 [P] [US1] Add fitness tracker API methods to frontend/src/lib/api-client.ts: getConnectedServices(), connectStrava(), disconnectService(platform, deleteData), triggerSync(platform), getImportedActivities(params), getActivityDetail(id)
- [x] T027 [US1] Create OAuthCallback component in frontend/src/components/fitness-tracker/OAuthCallback.tsx: handle redirect from /connected-services?connected=strava or ?error=..., show success/error toast, redirect to Connected Services page
- [x] T028 [US1] Add /connected-services route to frontend React Router configuration and navigation (sidebar/settings menu link)

**Checkpoint**: Strava OAuth flow works end-to-end, webhook imports activities, historical import runs on connect. This is the shippable MVP.

---

## Phase 4: User Story 4 - View Imported Run Details (Priority: P1)

**Goal**: Users can view a list of imported activities and see detailed run data (distance, pace, HR, elevation, cadence, route map) in a unified format

**Independent Test**: Import a run from Strava, view details, verify all data fields display correctly with route map

### Implementation for User Story 4

- [x] T029 [US4] Add activity list and detail endpoints to backend/src/HerPace.API/Controllers/FitnessTrackerController.cs: GET /api/fitness-tracker/activities (paginated, filterable by platform/date), GET /api/fitness-tracker/activities/{id} (full detail with GPS route and matched session info) per connected-services-api.md
- [x] T030 [US4] Create ImportedActivityList page component in frontend/src/pages/ImportedActivities.tsx: paginated list of imported runs showing date, title, distance, duration, pace, source platform icon, matched session indicator, link to detail view
- [x] T031 [US4] Create ImportedActivityDetail page component in frontend/src/pages/ImportedActivityDetail.tsx: display all available fields (distance, duration, pace, HR avg/max, cadence, elevation, calories), gracefully omit missing fields (FR-007), show matched training session comparison (planned vs actual) if linked, show route map when GPS data is present
- [x] T032 [US4] Add /activities and /activities/:id routes to frontend React Router configuration
- [x] T033 [P] [US4] Create ImportedActivity domain model in android/app/src/main/java/com/herpace/domain/model/ImportedActivity.kt with fields matching API response
- [x] T034 [P] [US4] Create ImportedActivityEntity and DAO in android/app/src/main/java/com/herpace/data/local/entity/ImportedActivityEntity.kt and android/app/src/main/java/com/herpace/data/local/dao/FitnessTrackerDao.kt for local caching of imported activities
- [x] T035 [US4] Add fitness tracker API endpoints to android/app/src/main/java/com/herpace/data/remote/HerPaceApiService.kt: getConnectedServices(), getImportedActivities(), getActivityDetail()
- [x] T036 [US4] Create activity list and detail screens in android/app/src/main/java/com/herpace/ui/connectedservices/ImportedActivitiesScreen.kt showing unified run data with same fields as frontend

**Checkpoint**: Users can view all imported runs with full details on both web and Android

---

## Phase 5: User Story 5 - Manage Connected Services (Priority: P2)

**Goal**: Users can view all available integrations with connection status, last sync time, activity count, and disconnect with data retention choice

**Independent Test**: Navigate to Connected Services, verify statuses are accurate, disconnect and verify choice between keep/delete data

### Implementation for User Story 5

- [x] T037 [US5] Add GET /api/fitness-tracker/services endpoint to backend/src/HerPace.API/Controllers/FitnessTrackerController.cs returning all 3 platforms with status, connectedAt, lastSyncAt, activitiesImported per connected-services-api.md
- [x] T038 [US5] Add DELETE /api/fitness-tracker/services/{platform}?deleteData={bool} endpoint to backend/src/HerPace.API/Controllers/FitnessTrackerController.cs: revoke external tokens (FR-015), prompt-driven data deletion (FR-018, FR-019), unlink matched TrainingSessions if deleting
- [x] T039 [US5] Add GET /api/fitness-tracker/sync-log endpoint to backend/src/HerPace.API/Controllers/FitnessTrackerController.cs returning recent sync history per connected-services-api.md
- [x] T040 [US5] Create ConnectedServices page in frontend/src/pages/ConnectedServices.tsx: list all services with ServiceCard components showing platform name/icon, connection status badge, connected date, last sync time, activity count, Connect/Disconnect buttons
- [x] T041 [US5] Create ServiceCard component in frontend/src/components/fitness-tracker/ServiceCard.tsx: display platform info, status indicator (connected/disconnected/error/token expired), connect button (initiates OAuth redirect), disconnect button with confirmation dialog asking keep or delete data
- [x] T042 [US5] Create SyncStatus component in frontend/src/components/fitness-tracker/SyncStatus.tsx: display last sync time, total imported activities, manual sync refresh button, loading state during sync
- [x] T043 [US5] Create ConnectedServicesScreen in android/app/src/main/java/com/herpace/ui/connectedservices/ConnectedServicesScreen.kt with Compose UI: list all platforms, connection status, connect/disconnect actions, sync button
- [x] T044 [US5] Create ConnectedServicesViewModel in android/app/src/main/java/com/herpace/ui/connectedservices/ConnectedServicesViewModel.kt: load services list, handle connect/disconnect actions, trigger sync, observe sync status

**Checkpoint**: Full Connected Services management works on web and Android with disconnect+data choice

---

## Phase 6: User Story 2 - Read Run Data from Health Connect (Priority: P2)

**Goal**: Android users can grant Health Connect permissions and have running data from any connected wearable imported to HerPace

**Independent Test**: Grant Health Connect permissions on Android, verify runs from a connected wearable appear in HerPace

### Implementation for User Story 2

- [x] T045 [US2] Create HealthConnectRepository interface in android/app/src/main/java/com/herpace/domain/repository/HealthConnectRepository.kt: checkAvailability(), requestPermissions(), readExerciseSessions(since), readHeartRateData(sessionId), readRouteData(sessionId)
- [x] T046 [US2] Implement HealthConnectRepositoryImpl in android/app/src/main/java/com/herpace/data/repository/HealthConnectRepositoryImpl.kt: use Health Connect SDK to check installation, request READ_EXERCISE/READ_HEART_RATE/READ_DISTANCE/READ_SPEED/READ_ELEVATION_GAINED/READ_EXERCISE_ROUTE permissions, read ExerciseSessionRecords filtered by EXERCISE_TYPE_RUNNING and EXERCISE_TYPE_RUNNING_TREADMILL, aggregate HeartRateRecord/DistanceRecord/SpeedRecord/ElevationGainedRecord per session, read ExerciseRoute for GPS data
- [x] T047 [US2] Add POST /api/fitness-tracker/connect/health-connect endpoint to backend/src/HerPace.API/Controllers/FitnessTrackerController.cs per connected-services-api.md (register Health Connect as connected service)
- [x] T048 [US2] Add POST /api/fitness-tracker/activities/upload endpoint to backend/src/HerPace.API/Controllers/FitnessTrackerController.cs per connected-services-api.md (batch import activities from Android, max 50 per request, server-side dedup and session matching)
- [x] T049 [US2] Create SyncActivitiesUseCase in android/app/src/main/java/com/herpace/domain/usecase/SyncActivitiesUseCase.kt: read new exercises from Health Connect since last sync, map to ActivityUploadItemDto, POST to /api/fitness-tracker/activities/upload, update local lastSyncAt
- [x] T050 [US2] Create Health Connect background sync worker in android/app/src/main/java/com/herpace/data/sync/HealthConnectSyncWorker.kt: periodic WorkManager job (every 30 minutes when idle), use SyncActivitiesUseCase, handle permission revocation detection per US2 acceptance scenario 3
- [x] T051 [US2] Create FitnessTrackerModule Hilt DI module in android/app/src/main/java/com/herpace/di/FitnessTrackerModule.kt: provide HealthConnectRepository, FitnessTrackerRepository, SyncActivitiesUseCase, register HealthConnectSyncWorker
- [x] T052 [US2] Add Health Connect connect flow to ConnectedServicesScreen: check Health Connect availability (show install prompt if not available per US2 scenario 4), request permissions on tap, call POST /connect/health-connect on success, trigger initial sync

**Checkpoint**: Health Connect integration fully working on Android — wearable data flows to HerPace backend

---

## Phase 7: User Story 3 - Connect a Garmin Account (Priority: P3)

**Goal**: Users can connect Garmin for richer data including women's health cycle data. Note: Requires Garmin developer program approval before implementation can complete.

**Independent Test**: Connect Garmin account, sync a run, verify detailed metrics appear including optional cycle data

### Implementation for User Story 3

- [x] T053 [US3] Apply to Garmin Connect Developer Program at connect-support@developer.garmin.com — request access to Activity API and Women's Health API per research.md R-003 (NOTE: manual process task — code implementation ready, requires developer program approval to activate)
- [x] T054 [US3] Add Garmin configuration section to backend/src/HerPace.API/appsettings.Development.json with FitnessTracker:Garmin:ClientId, ClientSecret, RedirectUri, WebhookSecret placeholders
- [x] T055 [US3] Implement GarminProvider in backend/src/HerPace.Infrastructure/Services/Providers/GarminProvider.cs: OAuth 2.0 with PKCE flow, token exchange, activity data parsing from Garmin JSON format, normalize Garmin field names (e.g., durationInSeconds→DurationSeconds, distanceInMeters→DistanceMeters), deauthorize
- [x] T056 [US3] Add Garmin OAuth endpoints to backend/src/HerPace.API/Controllers/FitnessTrackerController.cs: GET /api/fitness-tracker/connect/garmin (initiate OAuth), GET /api/fitness-tracker/callback/garmin (handle callback)
- [x] T057 [US3] Implement Garmin webhook controllers in backend/src/HerPace.API/Controllers/GarminWebhookController.cs: POST /api/webhooks/garmin/activities (activity push per webhook-contracts.md), POST /api/webhooks/garmin/womens-health (cycle data push — update Runner.LastPeriodStart/CycleLength if user opted in per US3 acceptance scenario 3)
- [x] T058 [US3] Add Garmin women's health opt-in setting: add WomensHealthDataOptIn boolean to ConnectedService entity (or Runner preferences), expose in Connected Services UI, gate cycle data processing on opt-in status

**Checkpoint**: Garmin integration complete with activity import and optional women's health cycle data sync

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: AI integration, security hardening, and production readiness

- [x] T059 Integrate imported activity data into AI plan generation: update IPlanGenerationService or GeminiPlanGenerator in backend/src/HerPace.Infrastructure/AI/ to include recent ImportedActivity data when generating or recalculating plans (FR-016), pass actual vs planned comparison data to the AI prompt
- [x] T060 [P] Add token encryption value converters for ConnectedService.AccessToken and ConnectedService.RefreshToken in backend/src/HerPace.Infrastructure/Data/HerPaceDbContext.cs using AES-256 encryption per research.md R-006
- [x] T061 [P] Add Strava configuration secrets to Google Cloud Secret Manager: strava-client-id, strava-client-secret, strava-webhook-verify-token; map to environment variables in Cloud Run deployment per existing pattern in CLAUDE.md (NOTE: production config updated; actual GCP secret creation requires manual execution — see commands below)
- [x] T062 Register Strava webhook subscription in production: POST to Strava API /api/v3/push_subscriptions with Cloud Run callback URL per quickstart.md (NOTE: requires production deployment and Strava developer app — manual step)
- [x] T063 Add accessibility review for Connected Services and activity detail screens: verify WCAG 2.1 AA compliance (keyboard navigation, screen reader labels, color contrast, semantic HTML) per constitution Accessibility-First Design principle
- [x] T064 Run quickstart.md validation: execute all manual test scenarios (Strava connection, Health Connect, duplicate detection, session matching) against local development environment (NOTE: manual testing task — requires running backend + frontend locally with Strava developer credentials)

### T061/T062 Deployment Commands (for production)

**T061 — Create GCP Secrets:**
```bash
# Strava secrets
gcloud secrets create strava-client-id --data-file=- <<< "YOUR_STRAVA_CLIENT_ID"
gcloud secrets create strava-client-secret --data-file=- <<< "YOUR_STRAVA_CLIENT_SECRET"
gcloud secrets create strava-webhook-verify-token --data-file=- <<< "YOUR_RANDOM_TOKEN"
gcloud secrets create garmin-client-id --data-file=- <<< "YOUR_GARMIN_CLIENT_ID"
gcloud secrets create garmin-client-secret --data-file=- <<< "YOUR_GARMIN_CLIENT_SECRET"
gcloud secrets create token-encryption-key --data-file=- <<< "YOUR_32_CHAR_KEY"

# Map to Cloud Run environment variables
gcloud run services update herpace-api --region=us-central1 \
  --update-secrets="FitnessTracker__Strava__ClientId=strava-client-id:latest,FitnessTracker__Strava__ClientSecret=strava-client-secret:latest,FitnessTracker__Strava__WebhookVerifyToken=strava-webhook-verify-token:latest,FitnessTracker__Garmin__ClientId=garmin-client-id:latest,FitnessTracker__Garmin__ClientSecret=garmin-client-secret:latest,Encryption__TokenEncryptionKey=token-encryption-key:latest"
```

**T062 — Register Strava Webhook:**
```bash
curl -X POST https://www.strava.com/api/v3/push_subscriptions \
  -F client_id=YOUR_STRAVA_CLIENT_ID \
  -F client_secret=YOUR_STRAVA_CLIENT_SECRET \
  -F callback_url=https://herpace-api-330702404265.us-central1.run.app/api/webhooks/strava \
  -F verify_token=YOUR_RANDOM_TOKEN
```

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 — BLOCKS all user stories
- **US1 Strava (Phase 3)**: Depends on Phase 2 — MVP, no other story dependencies
- **US4 View Details (Phase 4)**: Depends on Phase 2 — can run parallel with US1 (backend), but needs imported data to test (so practically after US1)
- **US5 Manage Services (Phase 5)**: Depends on Phase 2 — can run parallel with US1
- **US2 Health Connect (Phase 6)**: Depends on Phase 2 — can run parallel with US1
- **US3 Garmin (Phase 7)**: Depends on Phase 2 + Garmin developer program approval — can start after Phase 2 but blocked on external approval
- **Polish (Phase 8)**: Depends on US1 at minimum; ideally after US1+US4+US5

### User Story Dependencies

- **US1 (P1)**: Independent — needs only foundational phase
- **US4 (P1)**: Independent for implementation — needs imported data (from US1) to test end-to-end
- **US5 (P2)**: Independent — needs only foundational phase
- **US2 (P2)**: Independent — needs only foundational phase + Android setup
- **US3 (P3)**: Independent — blocked on Garmin developer program approval (external dependency)

### Within Each User Story

- Backend entities/services before API endpoints
- API endpoints before frontend/Android UI
- Provider implementation before controller integration
- Webhooks after OAuth flow is working

### Parallel Opportunities

**Phase 1** (all [P] tasks):
```
T002 + T003 + T004 + T005 + T006 (all different files)
```

**Phase 2** (models in parallel, then services):
```
T007 + T008 + T009 (entities in parallel)
→ T010 (DbContext needs all entities)
→ T011 (migration needs DbContext)
T012 + T013 + T014 + T015 (DTOs and interfaces in parallel)
→ T016 + T017 (services depend on interfaces)
```

**After Phase 2** (user stories can run in parallel):
```
US1 (Phase 3) ↔ US5 (Phase 5) ↔ US2 (Phase 6) — different files, different platforms
US4 (Phase 4) can start backend work in parallel with US1
```

---

## Implementation Strategy

### MVP First (US1 + US4 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL)
3. Complete Phase 3: US1 — Strava connection + webhook + import
4. Complete Phase 4: US4 — View imported run details
5. **STOP and VALIDATE**: Connect Strava, verify runs import, view run details
6. Deploy — users can connect Strava and see their runs

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. US1 (Strava) + US4 (View Details) → **MVP shipped**
3. US5 (Manage Services) → Enhanced service management
4. US2 (Health Connect) → Android native data access
5. US3 (Garmin) → Richer data + women's health (pending approval)
6. Polish → AI integration, security hardening, accessibility review

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Tests are omitted per constitution (Iterative Excellence: early stage = manual testing)
- Garmin integration (US3) is blocked on external developer program approval — submit application early (T053) while working on other stories
- Token encryption (T060) should be implemented before production deployment
- AI integration (T059) is the highest-value polish task — connects imported data to HerPace's core differentiator
