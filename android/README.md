# HerPace Android App

Native Android client for HerPace, a hormone-aware training plan application for women runners.

## Prerequisites

- **Android Studio** Hedgehog 2023.1.1+ (includes SDK, emulator, Gradle)
- **JDK 17** (bundled with Android Studio)
- **Android device or emulator** running API 26+ (Android 8.0 Oreo)
- **Firebase project** with `google-services.json` placed in `android/app/`

## Quick Start

```bash
# 1. Clone and checkout
git clone <repo-url>
cd HerPace
git checkout 001-android-app

# 2. Open in Android Studio
# File -> Open -> select the android/ directory

# 3. Sync Gradle (automatic on open)
# 4. Run on device/emulator (green play button)
```

### Command Line Build

```bash
cd android

# Debug build + install
./gradlew installDebug

# Release APK
./gradlew assembleRelease
# Output: app/build/outputs/apk/release/app-release.apk

# Run unit tests
./gradlew test

# Run instrumented tests (requires device)
./gradlew connectedAndroidTest
```

## Architecture

Clean Architecture with MVVM pattern, organized in three layers:

```
app/src/main/java/com/herpace/
├── data/                  # Data layer
│   ├── local/             # Room database, DAOs, entities
│   │   ├── dao/           # 7 DAOs (User, Race, TrainingPlan, etc.)
│   │   └── entity/        # 7 entities with SQLCipher encryption
│   ├── remote/            # Retrofit API service, DTOs, retry logic
│   │   └── dto/           # Auth, Profile, Race, Plan request/response DTOs
│   ├── repository/        # Repository implementations + AuthTokenProvider
│   └── sync/              # SyncManager + SyncWorker (WorkManager)
├── domain/                # Domain layer (pure Kotlin)
│   ├── model/             # 13 domain models (RunnerProfile, Race, etc.)
│   ├── repository/        # 6 repository interfaces
│   └── usecase/           # 23 use cases (login, signup, generate plan, etc.)
├── presentation/          # UI layer (Jetpack Compose)
│   ├── auth/              # Login, Signup, Onboarding screens
│   ├── dashboard/         # Main dashboard with today's workout
│   ├── races/             # Race list, add/edit race
│   ├── plan/              # Training plan, week view, calendar
│   ├── session/           # Session detail, workout logging
│   ├── profile/           # Profile, cycle tracking, notification settings
│   ├── common/            # Shared components (buttons, pickers, indicators)
│   ├── navigation/        # NavGraph, Screen routes, BottomNavBar
│   └── theme/             # Material 3 theme, colors, typography
├── di/                    # Hilt modules (Database, Network, Repository, Firebase)
├── notification/          # FCM service, notification scheduler, reminder worker
└── util/                  # AnalyticsHelper, BiometricHelper
```

## Tech Stack

| Category | Technology |
|----------|-----------|
| Language | Kotlin 1.9, JDK 17 |
| UI | Jetpack Compose + Material Design 3 |
| DI | Hilt (Dagger) |
| Networking | Retrofit 2.9 + OkHttp 4.12 |
| Serialization | Kotlinx Serialization |
| Database | Room 2.6 + SQLCipher 4.5 |
| Background | WorkManager 2.9 |
| Firebase | FCM, Crashlytics, Analytics |
| Security | EncryptedSharedPreferences, SQLCipher, Certificate Pinning, Biometric |
| Testing | JUnit 4, MockK, Turbine, Espresso |

## Configuration

### API Base URL

Configured in `app/build.gradle.kts` per build type:

- **Debug**: `https://herpace-api-330702404265.us-central1.run.app/` (production API)
- **Release**: Same production API URL

For local backend development, change debug URL to:
```kotlin
buildConfigField("String", "API_BASE_URL", "\"https://10.0.2.2:7001/\"")
```
(`10.0.2.2` maps to host localhost from the emulator)

### Firebase

Place `google-services.json` in `android/app/`. The app uses:
- **FCM** for push notification delivery
- **Crashlytics** for crash reporting (disabled in debug builds)
- **Analytics** for user event tracking

### Security Features

- **EncryptedSharedPreferences** for all sensitive data (auth tokens, sync prefs, FCM tokens, biometric settings)
- **SQLCipher** database encryption with Keystore-derived random key
- **Certificate Pinning** against GTS Root CAs for production API (release builds only)
- **Biometric Lock** optional app-level authentication via fingerprint/face
- **No Backup** (`allowBackup="false"`) to prevent data extraction

## API Integration

The app integrates with the HerPace backend REST API:

| Endpoint | Description |
|----------|-------------|
| `POST /api/auth/signup` | User registration |
| `POST /api/auth/login` | User login (returns JWT) |
| `GET\|POST /api/profiles/me` | Runner profile CRUD |
| `GET\|POST /api/races` | Race management |
| `GET\|PUT /api/races/{id}` | Single race operations |
| `POST /api/plans` | Generate AI training plan |
| `GET /api/plans/active` | Get active plan with sessions |

All API calls use:
- JWT Bearer token authentication (auto-injected by OkHttp interceptor)
- `safeApiCall` wrapper for consistent error handling
- `safeApiCallWithRetry` with exponential backoff for GET operations
- Offline-first: failed writes are saved locally with `NOT_SYNCED` status and retried via WorkManager

## Offline Support

The app follows an offline-first pattern:
1. **Reads**: Try API first, fall back to Room cache on failure
2. **Writes**: Try API first; on failure, save locally as `NOT_SYNCED`
3. **Background Sync**: WorkManager runs hourly + on-demand sync
4. **Conflict Resolution**: Server-wins strategy with user notification
