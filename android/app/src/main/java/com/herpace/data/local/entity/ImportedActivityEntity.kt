package com.herpace.data.local.entity

import androidx.room.Entity
import androidx.room.Index
import androidx.room.PrimaryKey
import com.herpace.data.local.SyncStatus
import com.herpace.domain.model.FitnessPlatform
import com.herpace.domain.model.ImportedActivity
import java.time.Instant

@Entity(
    tableName = "imported_activities",
    indices = [
        Index("platform"),
        Index("activityDate"),
        Index("syncStatus")
    ]
)
data class ImportedActivityEntity(
    @PrimaryKey val id: String,
    val platform: FitnessPlatform,
    val activityDate: Instant,
    val activityTitle: String?,
    val activityType: String,
    val distanceMeters: Double?,
    val durationSeconds: Int?,
    val movingTimeSeconds: Int?,
    val averagePaceSecondsPerKm: Double?,
    val averageHeartRate: Int?,
    val maxHeartRate: Int?,
    val cadence: Int?,
    val elevationGainMeters: Double?,
    val caloriesBurned: Int?,
    val hasGpsRoute: Boolean,
    val matchedTrainingSessionId: String?,
    val importedAt: Instant,
    val syncStatus: SyncStatus = SyncStatus.SYNCED,
    val lastModified: Instant = Instant.now()
) {
    fun toDomain(): ImportedActivity = ImportedActivity(
        id = id,
        platform = platform,
        activityDate = activityDate,
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
        hasGpsRoute = hasGpsRoute,
        matchedTrainingSessionId = matchedTrainingSessionId,
        importedAt = importedAt
    )

    companion object {
        fun fromDomain(
            activity: ImportedActivity,
            syncStatus: SyncStatus = SyncStatus.SYNCED
        ): ImportedActivityEntity = ImportedActivityEntity(
            id = activity.id,
            platform = activity.platform,
            activityDate = activity.activityDate,
            activityTitle = activity.activityTitle,
            activityType = activity.activityType,
            distanceMeters = activity.distanceMeters,
            durationSeconds = activity.durationSeconds,
            movingTimeSeconds = activity.movingTimeSeconds,
            averagePaceSecondsPerKm = activity.averagePaceSecondsPerKm,
            averageHeartRate = activity.averageHeartRate,
            maxHeartRate = activity.maxHeartRate,
            cadence = activity.cadence,
            elevationGainMeters = activity.elevationGainMeters,
            caloriesBurned = activity.caloriesBurned,
            hasGpsRoute = activity.hasGpsRoute,
            matchedTrainingSessionId = activity.matchedTrainingSessionId,
            importedAt = activity.importedAt,
            syncStatus = syncStatus,
            lastModified = Instant.now()
        )
    }
}
