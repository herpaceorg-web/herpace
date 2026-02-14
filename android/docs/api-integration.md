# API Integration Patterns

This document describes the patterns used for backend API communication in the HerPace Android app.

## Network Stack

```
ViewModel -> UseCase -> Repository -> Retrofit ApiService -> OkHttp -> Backend API
                                   -> Room DAO (cache)
```

**Key components:**
- `HerPaceApiService` (Retrofit interface) - API endpoint definitions
- `NetworkModule` (Hilt) - OkHttp client, Retrofit builder, JSON config
- `SafeApiCall.kt` - Wraps all API calls with error handling
- `RetryWithBackoff.kt` - Retry logic for GET operations
- `ApiResult<T>` - Sealed class for Success/Error/NetworkError

## ApiResult Pattern

All repository methods return `ApiResult<T>`:

```kotlin
sealed class ApiResult<out T> {
    data class Success<T>(val data: T) : ApiResult<T>()
    data class Error(val code: Int, val message: String?) : ApiResult<Nothing>()
    data object NetworkError : ApiResult<Nothing>()
}
```

Usage in ViewModels:
```kotlin
when (val result = useCase()) {
    is ApiResult.Success -> handleSuccess(result.data)
    is ApiResult.Error -> showError(result.message)
    is ApiResult.NetworkError -> showOfflineMessage()
}
```

## safeApiCall Wrapper

Every API call is wrapped in `safeApiCall`:

```kotlin
suspend fun <T> safeApiCall(apiCall: suspend () -> T): ApiResult<T> {
    return try {
        ApiResult.Success(apiCall())
    } catch (e: HttpException) { ... }
      catch (e: SocketTimeoutException) { ... }
      catch (e: IOException) { ApiResult.NetworkError }
      catch (e: Exception) { ... }
}
```

Behavior:
- HTTP 4xx/5xx -> `ApiResult.Error(code, message)` with body parsing
- `SocketTimeoutException` -> `ApiResult.NetworkError` + Crashlytics log
- `IOException` -> `ApiResult.NetworkError`
- HTTP 5xx -> additionally logged to Crashlytics
- Unexpected exceptions -> `ApiResult.Error(-1, message)` + Crashlytics

## Retry with Exponential Backoff

GET operations use `safeApiCallWithRetry` for resilience:

```kotlin
safeApiCallWithRetry(
    maxRetries = 3,           // Up to 3 retries
    initialDelayMs = 1000,    // Start at 1s
    maxDelayMs = 10000,       // Cap at 10s
    backoffMultiplier = 2.0   // Double each time: 1s -> 2s -> 4s
) {
    apiService.getProfile()
}
```

Retries on:
- Network errors (`IOException`)
- Server errors (HTTP 500-599)
- Rate limiting (HTTP 429)

Does NOT retry:
- Client errors (HTTP 4xx except 429)
- Unexpected exceptions

Applied to: `getProfile()`, `getRaces()`, `getRaceById()`, `getActivePlan()`

NOT applied to: `saveProfile()`, `createRace()`, `generatePlan()` (POST operations - to avoid duplicates)

## Authentication

JWT token is auto-injected by OkHttp interceptor:

```kotlin
.addInterceptor { chain ->
    val request = chain.request().newBuilder()
    val token = authTokenProvider.getToken()
    if (token != null && !chain.request().url.encodedPath.contains("/api/auth/")) {
        request.addHeader("Authorization", "Bearer $token")
    }
    chain.proceed(request.build())
}
```

Auth endpoints (`/api/auth/*`) are excluded from token injection.

Token is stored in `EncryptedSharedPreferences` via `AuthTokenProviderImpl`.

## Offline-First Repository Pattern

Each repository follows the same pattern:

### Reads (GET)

```kotlin
override suspend fun getRaces(): ApiResult<List<Race>> {
    val result = safeApiCallWithRetry { apiService.getRaces() }
    return when (result) {
        is ApiResult.Success -> {
            // Cache in Room
            raceDao.deleteAllByUserId(userId)
            raceDao.insertAll(races.map { RaceEntity.fromDomain(it) })
            ApiResult.Success(races)
        }
        is ApiResult.Error -> fallbackToCached()      // Return cached data
        is ApiResult.NetworkError -> fallbackToCached() // Return cached data
    }
}
```

### Writes (POST/PUT)

```kotlin
override suspend fun createRace(...): ApiResult<Race> {
    val result = safeApiCall { apiService.createRace(request) }
    return when (result) {
        is ApiResult.Success -> {
            raceDao.insert(RaceEntity.fromDomain(race, SyncStatus.SYNCED))
            ApiResult.Success(race)
        }
        is ApiResult.Error -> {
            // Save locally for later sync
            raceDao.insert(RaceEntity.fromDomain(localRace, SyncStatus.NOT_SYNCED))
            syncManager.requestImmediateSync()
            ApiResult.Success(localRace) // Return success to UI
        }
        is ApiResult.NetworkError -> { /* Same as Error */ }
    }
}
```

### Observation (Flow)

Room-backed Flows for reactive UI updates:

```kotlin
override fun observeRaces(): Flow<List<Race>> {
    return raceDao.observeAllByUserId(userId).map { entities ->
        entities.map { it.toDomain() }
    }
}
```

## Sync System

Background sync via WorkManager:

1. **Periodic**: Every hour when network available
2. **On-demand**: After local writes, app foreground
3. **Strategy**: Server-wins for conflicts
4. **Tracking**: `SyncStatus` enum (`SYNCED`, `NOT_SYNCED`, `CONFLICT`)

## Certificate Pinning

Release builds pin against Google Trust Services root CAs:

```kotlin
CertificatePinner.Builder()
    .add("*.us-central1.run.app",
        "sha256/hxqRlPTu1bMS/0DITB1SSu0vd4u/8l8TjPgfaAp63Gc=", // GTS Root R1
        "sha256/Vfd95BwDeSQo+NUYxVEEIBvvpOs/uqXEoSRMAOVo7R0="  // GTS Root R2
    )
```

Debug builds skip pinning to allow proxy tools (Charles, mitmproxy).
