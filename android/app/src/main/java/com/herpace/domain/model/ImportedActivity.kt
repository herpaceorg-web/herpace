package com.herpace.domain.model

import java.time.Instant

data class ImportedActivity(
    val id: String,
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
    val importedAt: Instant
) {
    val distanceKm: Double?
        get() = distanceMeters?.let { it / 1000.0 }

    val formattedPace: String?
        get() = averagePaceSecondsPerKm?.let {
            val m = (it / 60).toInt()
            val s = (it % 60).toInt()
            "$m:${s.toString().padStart(2, '0')} /km"
        }

    val formattedDuration: String?
        get() = durationSeconds?.let {
            val h = it / 3600
            val m = (it % 3600) / 60
            val s = it % 60
            if (h > 0) "$h:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}"
            else "$m:${s.toString().padStart(2, '0')}"
        }
}
