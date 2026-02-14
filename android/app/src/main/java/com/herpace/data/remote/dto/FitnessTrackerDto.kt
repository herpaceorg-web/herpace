package com.herpace.data.remote.dto

import com.herpace.domain.model.ConnectedService
import com.herpace.domain.model.ConnectionStatus
import com.herpace.domain.model.FitnessPlatform
import com.herpace.domain.model.ImportedActivity
import kotlinx.serialization.Serializable
import java.time.Instant

@Serializable
data class ConnectedServiceResponse(
    val platform: String,
    val displayName: String,
    val status: String,
    val externalUserId: String? = null,
    val connectedAt: String? = null,
    val lastSyncAt: String? = null,
    val activitiesImported: Int,
    val available: Boolean
) {
    fun toDomain(): ConnectedService = ConnectedService(
        platform = FitnessPlatform.fromApiValue(platform),
        displayName = displayName,
        status = ConnectionStatus.fromApiValue(status),
        externalUserId = externalUserId,
        connectedAt = connectedAt?.let { Instant.parse(it) },
        lastSyncAt = lastSyncAt?.let { Instant.parse(it) },
        activitiesImported = activitiesImported,
        available = available
    )
}

@Serializable
data class ServicesListResponse(
    val services: List<ConnectedServiceResponse>
)

@Serializable
data class DisconnectServiceResponse(
    val platform: String,
    val status: String,
    val dataDeleted: Boolean,
    val activitiesRetained: Int
)

@Serializable
data class SyncTriggerResponse(
    val syncId: String,
    val message: String
)

@Serializable
data class ImportedActivitySummaryResponse(
    val id: String,
    val platform: String,
    val activityDate: String,
    val activityTitle: String? = null,
    val activityType: String,
    val distanceMeters: Double? = null,
    val durationSeconds: Int? = null,
    val averagePaceSecondsPerKm: Double? = null,
    val averageHeartRate: Int? = null,
    val maxHeartRate: Int? = null,
    val cadence: Int? = null,
    val elevationGainMeters: Double? = null,
    val caloriesBurned: Int? = null,
    val hasGpsRoute: Boolean = false,
    val matchedTrainingSessionId: String? = null,
    val importedAt: String
) {
    fun toDomain(): ImportedActivity = ImportedActivity(
        id = id,
        platform = FitnessPlatform.fromApiValue(platform),
        activityDate = Instant.parse(activityDate),
        activityTitle = activityTitle,
        activityType = activityType,
        distanceMeters = distanceMeters,
        durationSeconds = durationSeconds,
        movingTimeSeconds = null,
        averagePaceSecondsPerKm = averagePaceSecondsPerKm,
        averageHeartRate = averageHeartRate,
        maxHeartRate = maxHeartRate,
        cadence = cadence,
        elevationGainMeters = elevationGainMeters,
        caloriesBurned = caloriesBurned,
        hasGpsRoute = hasGpsRoute,
        matchedTrainingSessionId = matchedTrainingSessionId,
        importedAt = Instant.parse(importedAt)
    )
}

@Serializable
data class PaginationResponse(
    val page: Int,
    val pageSize: Int,
    val totalItems: Int,
    val totalPages: Int
)

@Serializable
data class PaginatedActivitiesResponse(
    val activities: List<ImportedActivitySummaryResponse>,
    val pagination: PaginationResponse
)

@Serializable
data class GpsPointResponse(
    val lat: Double,
    val lng: Double,
    val altitude: Double? = null
)

@Serializable
data class MatchedSessionResponse(
    val id: String,
    val sessionName: String,
    val scheduledDate: String,
    val workoutType: String,
    val plannedDistance: Double? = null,
    val plannedDuration: Int? = null
)

// OAuth initiation response (Strava/Garmin)
@Serializable
data class OAuthInitiateResponse(
    val authorizationUrl: String,
    val state: String
)

// Health Connect upload DTOs
@Serializable
data class ConnectHealthConnectRequest(
    val grantedPermissions: List<String>
)

@Serializable
data class ConnectHealthConnectResponse(
    val platform: String,
    val status: String,
    val connectedAt: String
)

@Serializable
data class ActivityUploadRequest(
    val activities: List<ActivityUploadItem>
)

@Serializable
data class ActivityUploadItem(
    val externalActivityId: String,
    val activityDate: String,
    val activityType: String,
    val distanceMeters: Double? = null,
    val durationSeconds: Int? = null,
    val averageHeartRate: Int? = null,
    val maxHeartRate: Int? = null,
    val cadence: Int? = null,
    val elevationGainMeters: Double? = null,
    val caloriesBurned: Int? = null,
    val gpsRoute: List<GpsPointResponse>? = null
)

@Serializable
data class ActivityUploadResponse(
    val imported: Int,
    val duplicates: Int,
    val filtered: Int,
    val activities: List<ActivityUploadResultItem>
)

@Serializable
data class ActivityUploadResultItem(
    val id: String? = null,
    val externalActivityId: String,
    val status: String,
    val matchedTrainingSessionId: String? = null
)

@Serializable
data class ImportedActivityDetailResponse(
    val id: String,
    val platform: String,
    val activityDate: String,
    val activityTitle: String? = null,
    val activityType: String,
    val distanceMeters: Double? = null,
    val durationSeconds: Int? = null,
    val movingTimeSeconds: Int? = null,
    val averagePaceSecondsPerKm: Double? = null,
    val averageHeartRate: Int? = null,
    val maxHeartRate: Int? = null,
    val cadence: Int? = null,
    val elevationGainMeters: Double? = null,
    val caloriesBurned: Int? = null,
    val gpsRoute: List<GpsPointResponse>? = null,
    val matchedTrainingSession: MatchedSessionResponse? = null,
    val importedAt: String
) {
    fun toDomain(): ImportedActivity = ImportedActivity(
        id = id,
        platform = FitnessPlatform.fromApiValue(platform),
        activityDate = Instant.parse(activityDate),
        activityTitle = activityTitle,
        activityType = activityType,
        distanceMeters = distanceMeters,
        durationSeconds = durationSeconds,
        movingTimeSeconds = movingTimeSeconds,
        averagePaceSecondsPerKm = averagePaceSecondsPerKm,
        averageHeartRate = averageHeartRate,
        maxHeartRate = maxHeartRate,
        cadence = cadence,
        elevationGainMeters = elevationGainMeters,
        caloriesBurned = caloriesBurned,
        hasGpsRoute = gpsRoute != null && gpsRoute.isNotEmpty(),
        matchedTrainingSessionId = matchedTrainingSession?.id,
        importedAt = Instant.parse(importedAt)
    )
}
