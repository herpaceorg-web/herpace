# Quickstart: Fitness Tracker Integration

**Feature**: 002-fitness-tracker-integration
**Date**: 2026-02-11

## Prerequisites

- .NET 8.0 SDK
- PostgreSQL 15+ running locally
- Android Studio with SDK 28+
- Node.js 18+ and npm
- Strava developer account (for testing)

## Setup Steps

### 1. Strava Developer App

1. Go to https://www.strava.com/settings/api and create an application
2. Set the authorization callback domain to `localhost`
3. Note the Client ID and Client Secret
4. Add to backend configuration:

```json
// backend/src/HerPace.API/appsettings.Development.json
{
  "FitnessTracker": {
    "Strava": {
      "ClientId": "YOUR_CLIENT_ID",
      "ClientSecret": "YOUR_CLIENT_SECRET",
      "RedirectUri": "https://localhost:7001/api/fitness-tracker/callback/strava",
      "WebhookVerifyToken": "your-random-verify-token"
    }
  }
}
```

### 2. Database Migration

```bash
# Create the migration
dotnet ef migrations add AddFitnessTrackerEntities --project backend/src/HerPace.Infrastructure --startup-project backend/src/HerPace.API

# Apply the migration
dotnet ef database update --project backend/src/HerPace.Infrastructure --startup-project backend/src/HerPace.API
```

### 3. Backend

```bash
# Build and run
dotnet run --project backend/src/HerPace.API
```

The API will be available at `https://localhost:7001`.

### 4. Strava Webhook (Local Development)

For local webhook testing, use a tunnel service to expose your local API:

```bash
# Using ngrok or similar
ngrok http 7001

# Then register the webhook with Strava:
# POST https://www.strava.com/api/v3/push_subscriptions
# with callback_url = your-ngrok-url/api/webhooks/strava
```

**Note**: Webhook registration is only needed once per app. In production, this is configured during deployment.

### 5. Android App (Health Connect)

1. Ensure Health Connect app is installed on test device/emulator
2. Add Health Connect permissions to `AndroidManifest.xml`:

```xml
<uses-permission android:name="android.permission.health.READ_EXERCISE" />
<uses-permission android:name="android.permission.health.READ_HEART_RATE" />
<uses-permission android:name="android.permission.health.READ_DISTANCE" />
<uses-permission android:name="android.permission.health.READ_SPEED" />
<uses-permission android:name="android.permission.health.READ_ELEVATION_GAINED" />
<uses-permission android:name="android.permission.health.READ_EXERCISE_ROUTE" />
```

3. Build and run:

```bash
cd android
./gradlew installDebug
```

### 6. Frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend will be available at `http://localhost:5163`.

## Testing the Integration

### Manual Test: Strava Connection

1. Log in to HerPace
2. Navigate to Connected Services page
3. Click "Connect Strava"
4. Authorize on Strava's page
5. Verify redirect back to HerPace with "Connected" status
6. Check that recent runs (last 30 days) appear in activity list

### Manual Test: Health Connect (Android)

1. Open HerPace Android app
2. Navigate to Connected Services
3. Tap "Connect Health Connect"
4. Grant permissions in the system dialog
5. Verify recent running exercises from Health Connect appear

### Manual Test: Duplicate Detection

1. Connect both Strava and Health Connect
2. Record a run that syncs to both platforms
3. Verify only one copy appears in HerPace

### Manual Test: Session Matching

1. Have an active training plan with sessions
2. Complete a run on a day with a scheduled session
3. Import the run via a connected service
4. Verify the training session shows as completed with actual metrics

## Key Configuration

| Setting | Default | Description |
|---------|---------|-------------|
| `FitnessTracker:Strava:ClientId` | — | Strava app client ID |
| `FitnessTracker:Strava:ClientSecret` | — | Strava app client secret |
| `FitnessTracker:Strava:RedirectUri` | — | OAuth callback URL |
| `FitnessTracker:Strava:WebhookVerifyToken` | — | Webhook subscription verify token |
| `FitnessTracker:InitialImportDays` | 30 | Days of history to import on first connect |
| `FitnessTracker:SyncCooldownMinutes` | 5 | Minimum time between manual syncs |
| `FitnessTracker:DuplicateTimeToleranceSeconds` | 60 | Max time difference for duplicate detection |
| `FitnessTracker:DuplicateDistanceTolerancePercent` | 1 | Max distance difference % for duplicate detection |

## Phased Delivery

| Phase | Platform | Prerequisites | MVP? |
|-------|----------|---------------|------|
| 1 | Strava | Strava developer app | Yes |
| 2 | Health Connect | Android SDK 28+ device | No |
| 3 | Garmin | Garmin developer program approval | No |

Phase 1 (Strava) is the MVP and can be shipped independently. Phases 2 and 3 extend the same backend interfaces and data model.
