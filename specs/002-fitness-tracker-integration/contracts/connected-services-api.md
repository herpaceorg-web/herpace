# API Contracts: Connected Services

**Feature**: 002-fitness-tracker-integration
**Base Path**: `/api/fitness-tracker`

## Authentication

All endpoints require JWT Bearer token authentication (existing HerPace auth) unless noted otherwise.

---

## Endpoints

### GET /api/fitness-tracker/services

List all available fitness services and their connection status for the authenticated user.

**Maps to**: FR-008, User Story 5

**Response** `200 OK`:
```json
{
  "services": [
    {
      "platform": "Strava",
      "displayName": "Strava",
      "status": "Connected",
      "externalUserId": "12345678",
      "connectedAt": "2026-02-01T10:00:00Z",
      "lastSyncAt": "2026-02-11T08:30:00Z",
      "activitiesImported": 15,
      "available": true
    },
    {
      "platform": "HealthConnect",
      "displayName": "Health Connect",
      "status": "NotConnected",
      "externalUserId": null,
      "connectedAt": null,
      "lastSyncAt": null,
      "activitiesImported": 0,
      "available": true
    },
    {
      "platform": "Garmin",
      "displayName": "Garmin Connect",
      "status": "NotConnected",
      "externalUserId": null,
      "connectedAt": null,
      "lastSyncAt": null,
      "activitiesImported": 0,
      "available": false
    }
  ]
}
```

**Notes**:
- `available: false` for Garmin until developer program approval is complete
- `status` values: `"Connected"`, `"NotConnected"`, `"TokenExpired"`, `"Error"`
- `activitiesImported` is the total count of ImportedActivity records for this platform

---

### GET /api/fitness-tracker/connect/strava

Initiate Strava OAuth flow. Returns the authorization URL to redirect the user to.

**Maps to**: FR-001, FR-002, User Story 1

**Response** `200 OK`:
```json
{
  "authorizationUrl": "https://www.strava.com/oauth/authorize?client_id=...&redirect_uri=...&response_type=code&scope=activity:read_all,profile:read_all&state=...",
  "state": "random-csrf-token"
}
```

**Error** `409 Conflict` (already connected):
```json
{
  "error": "Strava is already connected. Disconnect first to reconnect."
}
```

---

### GET /api/fitness-tracker/callback/strava

OAuth callback endpoint. Strava redirects here after user authorization.

**Maps to**: FR-002

**Query Parameters**:
- `code` (string, required) — Authorization code from Strava
- `state` (string, required) — CSRF token for validation
- `scope` (string) — Granted scopes
- `error` (string, optional) — Error if user denied access

**Response** `302 Redirect`:
- Success: Redirects to `/connected-services?connected=strava`
- User denied: Redirects to `/connected-services?error=denied&platform=strava`
- Error: Redirects to `/connected-services?error=auth_failed&platform=strava`

**Side effects**:
- Exchanges code for access/refresh tokens
- Creates ConnectedService record
- Triggers initial historical import (last 30 days) via background job

---

### POST /api/fitness-tracker/connect/health-connect

Register Health Connect as connected (called from Android app after permissions are granted on-device).

**Maps to**: FR-001, FR-002, User Story 2

**Request**:
```json
{
  "grantedPermissions": ["READ_EXERCISE", "READ_HEART_RATE", "READ_DISTANCE", "READ_SPEED", "READ_ELEVATION_GAINED"]
}
```

**Response** `200 OK`:
```json
{
  "platform": "HealthConnect",
  "status": "Connected",
  "connectedAt": "2026-02-11T10:00:00Z"
}
```

**Notes**: Health Connect doesn't use OAuth — the Android app reads data locally and uploads to the backend. This endpoint simply records that the user has granted permissions.

---

### DELETE /api/fitness-tracker/services/{platform}

Disconnect a fitness service.

**Maps to**: FR-001, FR-015, FR-018, FR-019

**Path Parameters**:
- `platform` (string, required) — "Strava", "HealthConnect", or "Garmin"

**Query Parameters**:
- `deleteData` (bool, required) — Whether to delete all imported data from this service

**Response** `200 OK`:
```json
{
  "platform": "Strava",
  "status": "Disconnected",
  "dataDeleted": false,
  "activitiesRetained": 15
}
```

**Side effects**:
- Revokes access token with the external service (FR-015)
- If `deleteData=true`: permanently deletes all ImportedActivity records from this platform, unlinks matched TrainingSessions (FR-019)
- Creates SyncLog entry recording the disconnection

---

### POST /api/fitness-tracker/sync/{platform}

Manually trigger a sync for a connected service.

**Maps to**: FR-012

**Path Parameters**:
- `platform` (string, required) — "Strava", "HealthConnect", or "Garmin"

**Response** `202 Accepted`:
```json
{
  "syncId": "guid-of-sync-log",
  "message": "Sync initiated. Activities will appear shortly."
}
```

**Error** `404 Not Found` (service not connected):
```json
{
  "error": "Strava is not connected. Connect it first."
}
```

**Error** `429 Too Many Requests` (rate limited):
```json
{
  "error": "Sync was recently triggered. Please wait before trying again.",
  "retryAfterSeconds": 300
}
```

---

### GET /api/fitness-tracker/activities

List imported activities for the authenticated user.

**Maps to**: FR-007, User Story 4

**Query Parameters**:
- `page` (int, default: 1) — Page number
- `pageSize` (int, default: 20, max: 50) — Items per page
- `platform` (string, optional) — Filter by platform
- `from` (date, optional) — Filter activities from this date
- `to` (date, optional) — Filter activities to this date

**Response** `200 OK`:
```json
{
  "activities": [
    {
      "id": "guid",
      "platform": "Strava",
      "activityDate": "2026-02-10T07:30:00Z",
      "activityTitle": "Morning Run",
      "activityType": "Run",
      "distanceMeters": 8045.5,
      "durationSeconds": 2580,
      "averagePaceSecondsPerKm": 320.5,
      "averageHeartRate": 152,
      "maxHeartRate": 175,
      "cadence": 172,
      "elevationGainMeters": 85.3,
      "caloriesBurned": 520,
      "hasGpsRoute": true,
      "matchedTrainingSessionId": "guid-or-null",
      "importedAt": "2026-02-10T08:15:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "totalItems": 42,
    "totalPages": 3
  }
}
```

---

### GET /api/fitness-tracker/activities/{id}

Get full details of an imported activity, including GPS route data.

**Maps to**: FR-007, User Story 4

**Response** `200 OK`:
```json
{
  "id": "guid",
  "platform": "Strava",
  "activityDate": "2026-02-10T07:30:00Z",
  "activityTitle": "Morning Run",
  "activityType": "Run",
  "distanceMeters": 8045.5,
  "durationSeconds": 2580,
  "movingTimeSeconds": 2520,
  "averagePaceSecondsPerKm": 320.5,
  "averageHeartRate": 152,
  "maxHeartRate": 175,
  "cadence": 172,
  "elevationGainMeters": 85.3,
  "caloriesBurned": 520,
  "gpsRoute": [
    { "lat": 40.7128, "lng": -74.0060, "altitude": 10.5 },
    { "lat": 40.7130, "lng": -74.0058, "altitude": 11.0 }
  ],
  "matchedTrainingSession": {
    "id": "guid",
    "sessionName": "Easy Run",
    "scheduledDate": "2026-02-10",
    "workoutType": "Easy",
    "plannedDistance": 8000,
    "plannedDuration": 2700
  },
  "importedAt": "2026-02-10T08:15:00Z"
}
```

**Notes**:
- `gpsRoute` is null if no GPS data available
- `matchedTrainingSession` is null if the activity doesn't match any planned session
- Route data can be large; this endpoint should only be called when viewing a specific activity detail

---

### POST /api/fitness-tracker/activities/upload

Upload activities from Health Connect (called by Android app after reading on-device data).

**Maps to**: FR-003, FR-004, FR-005, User Story 2

**Request**:
```json
{
  "activities": [
    {
      "externalActivityId": "health-connect-exercise-id",
      "activityDate": "2026-02-10T07:30:00Z",
      "activityType": "Run",
      "distanceMeters": 8045.5,
      "durationSeconds": 2580,
      "averageHeartRate": 152,
      "maxHeartRate": 175,
      "cadence": 172,
      "elevationGainMeters": 85.3,
      "caloriesBurned": 520,
      "gpsRoute": [
        { "lat": 40.7128, "lng": -74.0060 }
      ]
    }
  ]
}
```

**Response** `200 OK`:
```json
{
  "imported": 1,
  "duplicates": 0,
  "filtered": 0,
  "activities": [
    {
      "id": "guid",
      "externalActivityId": "health-connect-exercise-id",
      "status": "imported",
      "matchedTrainingSessionId": "guid-or-null"
    }
  ]
}
```

**Notes**:
- Batch upload — can include multiple activities in one request
- Each activity goes through duplicate detection and session matching
- Non-running activities should be filtered client-side, but server also validates `activityType`

---

### GET /api/fitness-tracker/sync-log

Get recent sync history for the authenticated user.

**Maps to**: FR-014, User Story 5

**Query Parameters**:
- `platform` (string, optional) — Filter by platform
- `limit` (int, default: 10, max: 50) — Number of entries

**Response** `200 OK`:
```json
{
  "logs": [
    {
      "id": "guid",
      "platform": "Strava",
      "syncType": "webhook",
      "startedAt": "2026-02-11T08:30:00Z",
      "completedAt": "2026-02-11T08:30:05Z",
      "activitiesImported": 1,
      "activitiesDuplicate": 0,
      "activitiesFiltered": 0,
      "success": true,
      "errorMessage": null
    }
  ]
}
```
