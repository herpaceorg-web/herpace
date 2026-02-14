package com.herpace.domain.repository

import java.time.Instant

/**
 * Repository for interacting with Android Health Connect on-device health data.
 * Handles availability checks, permission management, and reading exercise data.
 */
interface HealthConnectRepository {

    /**
     * Check if Health Connect is available on this device.
     * Returns the availability status.
     */
    suspend fun checkAvailability(): HealthConnectAvailability

    /**
     * Check if the required Health Connect permissions have been granted.
     */
    suspend fun hasPermissions(): Boolean

    /**
     * Get the set of permissions that need to be requested.
     * Returns empty set if all permissions are already granted.
     */
    fun getRequiredPermissions(): Set<String>

    /**
     * Read exercise sessions from Health Connect since the given timestamp.
     * Only returns running and treadmill running sessions.
     */
    suspend fun readExerciseSessions(since: Instant): List<HealthConnectExercise>

    /**
     * Read heart rate data for a specific exercise session time range.
     */
    suspend fun readHeartRateData(startTime: Instant, endTime: Instant): HeartRateData?

    /**
     * Read route (GPS) data for a specific exercise session time range.
     */
    suspend fun readRouteData(startTime: Instant, endTime: Instant): List<GpsPoint>
}

enum class HealthConnectAvailability {
    AVAILABLE,
    NOT_INSTALLED,
    NOT_SUPPORTED
}

data class HealthConnectExercise(
    val id: String,
    val startTime: Instant,
    val endTime: Instant,
    val title: String?,
    val exerciseType: Int,
    val distanceMeters: Double?,
    val durationSeconds: Int?,
    val averageHeartRate: Int?,
    val maxHeartRate: Int?,
    val cadence: Int?,
    val elevationGainMeters: Double?,
    val caloriesBurned: Int?,
    val gpsRoute: List<GpsPoint>
)

data class HeartRateData(
    val averageBpm: Int?,
    val maxBpm: Int?
)

data class GpsPoint(
    val latitude: Double,
    val longitude: Double,
    val altitude: Double? = null
)
