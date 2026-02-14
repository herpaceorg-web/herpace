# Webhook Contracts: Fitness Tracker Integration

**Feature**: 002-fitness-tracker-integration
**Date**: 2026-02-11

## Strava Webhook

### Subscription Validation

Strava validates the webhook endpoint during subscription creation.

**Endpoint**: `GET /api/webhooks/strava`
**Authentication**: None (public endpoint)

**Query Parameters** (from Strava):
- `hub.mode` (string) — Always "subscribe"
- `hub.challenge` (string) — Random string to echo back
- `hub.verify_token` (string) — Token set during subscription creation

**Response** `200 OK`:
```json
{
  "hub.challenge": "echo-back-the-challenge-string"
}
```

**Validation**:
- Must respond within 2 seconds
- Must verify `hub.verify_token` matches the token configured during subscription
- Must return `hub.challenge` exactly as received

---

### Event Notification

Strava sends event notifications when activities are created, updated, or deleted.

**Endpoint**: `POST /api/webhooks/strava`
**Authentication**: None (validated by payload structure and subscription context)
**Content-Type**: `application/json`

**Request** (from Strava):
```json
{
  "object_type": "activity",
  "object_id": 12345678,
  "aspect_type": "create",
  "owner_id": 87654321,
  "subscription_id": 1234,
  "event_time": 1707645000,
  "updates": {}
}
```

**Fields**:
| Field | Type | Description |
|-------|------|-------------|
| object_type | string | "activity" or "athlete" |
| object_id | long | Activity ID or Athlete ID |
| aspect_type | string | "create", "update", or "delete" |
| owner_id | long | Strava athlete ID of the event owner |
| subscription_id | int | Webhook subscription ID |
| event_time | long | Unix timestamp of the event |
| updates | object | Changed fields (for updates only) |

**Response**: `200 OK` (empty body — must respond quickly)

**Processing rules**:
1. Respond `200 OK` immediately (within 2 seconds)
2. Queue a background job (Hangfire) for actual processing
3. Event routing by `object_type` + `aspect_type`:

| Event | Action |
|-------|--------|
| `activity.create` | Look up ConnectedService by `owner_id`. Fetch full activity from Strava API. Run import pipeline (filter → normalize → dedup → match → store). |
| `activity.update` | Ignore (per clarification: imported records are point-in-time snapshots). |
| `activity.delete` | Ignore (retain imported record — it's our copy of the data). |
| `athlete.deauthorize` | Mark ConnectedService as Disconnected. Log in SyncLog. |

**Error handling**:
- If Strava doesn't receive `200 OK`, it retries up to 3 times
- If the athlete's token is expired during activity fetch, mark ConnectedService as TokenExpired and skip

---

## Garmin Push Notification (Future — P3)

### Activity Push

Garmin pushes activity data to a registered endpoint when a user syncs their device.

**Endpoint**: `POST /api/webhooks/garmin/activities`
**Authentication**: Verified by Garmin's server-to-server trust model (configured during developer program onboarding)

**Request** (from Garmin — simplified):
```json
{
  "activityDetails": [
    {
      "userId": "garmin-user-id",
      "activityId": 12345678,
      "activityType": "RUNNING",
      "startTimeInSeconds": 1707645000,
      "startTimeOffsetInSeconds": -18000,
      "durationInSeconds": 2580,
      "distanceInMeters": 8045.5,
      "averageHeartRateInBeatsPerMinute": 152,
      "maxHeartRateInBeatsPerMinute": 175,
      "averageRunCadenceInStepsPerMinute": 172,
      "totalElevationGainInMeters": 85.3,
      "activeKilocalories": 520
    }
  ]
}
```

**Response**: `200 OK` (empty body)

**Processing rules**:
- Same pipeline as Strava: filter → normalize → dedup → match → store
- Garmin pushes data automatically — no need to fetch separately

---

## Garmin Women's Health Push (Future — P3)

### Cycle Data Push

Garmin pushes menstrual cycle data when a user syncs and has women's health tracking enabled.

**Endpoint**: `POST /api/webhooks/garmin/womens-health`
**Authentication**: Garmin server-to-server trust

**Request** (from Garmin — simplified):
```json
{
  "womensHealthDetails": [
    {
      "userId": "garmin-user-id",
      "calendarDate": "2026-02-11",
      "periodStartDate": "2026-02-08",
      "predictedCycleLength": 28,
      "currentPhase": "MENSTRUAL",
      "dayOfCycle": 4
    }
  ]
}
```

**Processing rules**:
- If user has opted in to sharing women's health data (per User Story 3, acceptance scenario 3)
- Update Runner's cycle data (LastPeriodStart, CycleLength) if Garmin data is more recent
- Create CycleLog entry for tracking
- May trigger training plan recalculation if cycle data significantly differs from current assumptions

**Note**: Garmin Women's Health API details will be finalized during developer program onboarding. The contract above is based on published documentation and may need adjustment.
