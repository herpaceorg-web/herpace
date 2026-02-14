package com.herpace.data.repository

import android.content.Context
import android.util.Log
import androidx.health.connect.client.HealthConnectClient
import androidx.health.connect.client.PermissionController
import androidx.health.connect.client.permission.HealthPermission
import androidx.health.connect.client.records.DistanceRecord
import androidx.health.connect.client.records.ElevationGainedRecord
import androidx.health.connect.client.records.ExerciseRouteResult
import androidx.health.connect.client.records.ExerciseSessionRecord
import androidx.health.connect.client.records.HeartRateRecord
import androidx.health.connect.client.records.SpeedRecord
import androidx.health.connect.client.records.StepsCadenceRecord
import androidx.health.connect.client.records.TotalCaloriesBurnedRecord
import androidx.health.connect.client.request.ReadRecordsRequest
import androidx.health.connect.client.time.TimeRangeFilter
import com.herpace.domain.repository.GpsPoint
import com.herpace.domain.repository.HealthConnectAvailability
import com.herpace.domain.repository.HealthConnectExercise
import com.herpace.domain.repository.HealthConnectRepository
import com.herpace.domain.repository.HeartRateData
import dagger.hilt.android.qualifiers.ApplicationContext
import java.time.Instant
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class HealthConnectRepositoryImpl @Inject constructor(
    @ApplicationContext private val context: Context
) : HealthConnectRepository {

    companion object {
        private const val TAG = "HealthConnectRepo"

        // Running exercise types from Health Connect SDK
        private const val EXERCISE_TYPE_RUNNING = 56
        private const val EXERCISE_TYPE_RUNNING_TREADMILL = 57

        val REQUIRED_PERMISSIONS = setOf(
            HealthPermission.getReadPermission(ExerciseSessionRecord::class),
            HealthPermission.getReadPermission(HeartRateRecord::class),
            HealthPermission.getReadPermission(DistanceRecord::class),
            HealthPermission.getReadPermission(SpeedRecord::class),
            HealthPermission.getReadPermission(ElevationGainedRecord::class)
        )
    }

    private val healthConnectClient: HealthConnectClient? by lazy {
        try {
            HealthConnectClient.getOrCreate(context)
        } catch (e: Exception) {
            Log.w(TAG, "Failed to create HealthConnectClient", e)
            null
        }
    }

    override suspend fun checkAvailability(): HealthConnectAvailability {
        val status = HealthConnectClient.getSdkStatus(context)
        return when (status) {
            HealthConnectClient.SDK_AVAILABLE -> HealthConnectAvailability.AVAILABLE
            HealthConnectClient.SDK_UNAVAILABLE_PROVIDER_UPDATE_REQUIRED ->
                HealthConnectAvailability.NOT_INSTALLED
            else -> HealthConnectAvailability.NOT_SUPPORTED
        }
    }

    override suspend fun hasPermissions(): Boolean {
        val client = healthConnectClient ?: return false
        val granted = client.permissionController.getGrantedPermissions()
        return REQUIRED_PERMISSIONS.all { it in granted }
    }

    override fun getRequiredPermissions(): Set<String> {
        return REQUIRED_PERMISSIONS
    }

    override suspend fun readExerciseSessions(since: Instant): List<HealthConnectExercise> {
        val client = healthConnectClient ?: return emptyList()

        try {
            val response = client.readRecords(
                ReadRecordsRequest(
                    recordType = ExerciseSessionRecord::class,
                    timeRangeFilter = TimeRangeFilter.after(since)
                )
            )

            return response.records
                .filter { session ->
                    session.exerciseType == EXERCISE_TYPE_RUNNING ||
                        session.exerciseType == EXERCISE_TYPE_RUNNING_TREADMILL
                }
                .map { session ->
                    val startTime = session.startTime
                    val endTime = session.endTime
                    val durationSec = java.time.Duration.between(startTime, endTime).seconds.toInt()

                    // Read associated metrics for this session
                    val distance = readDistance(client, startTime, endTime)
                    val heartRate = readHeartRateData(startTime, endTime)
                    val elevation = readElevation(client, startTime, endTime)
                    val calories = readCalories(client, startTime, endTime)
                    val cadence = readCadence(client, startTime, endTime)
                    val route = readRouteData(startTime, endTime)

                    HealthConnectExercise(
                        id = session.metadata.id,
                        startTime = startTime,
                        endTime = endTime,
                        title = session.title,
                        exerciseType = session.exerciseType,
                        distanceMeters = distance,
                        durationSeconds = durationSec,
                        averageHeartRate = heartRate?.averageBpm,
                        maxHeartRate = heartRate?.maxBpm,
                        cadence = cadence,
                        elevationGainMeters = elevation,
                        caloriesBurned = calories,
                        gpsRoute = route
                    )
                }
        } catch (e: Exception) {
            Log.e(TAG, "Error reading exercise sessions", e)
            return emptyList()
        }
    }

    override suspend fun readHeartRateData(startTime: Instant, endTime: Instant): HeartRateData? {
        val client = healthConnectClient ?: return null
        return try {
            val response = client.readRecords(
                ReadRecordsRequest(
                    recordType = HeartRateRecord::class,
                    timeRangeFilter = TimeRangeFilter.between(startTime, endTime)
                )
            )

            val allSamples = response.records.flatMap { it.samples }
            if (allSamples.isEmpty()) return null

            HeartRateData(
                averageBpm = allSamples.map { it.beatsPerMinute }.average().toInt(),
                maxBpm = allSamples.maxOf { it.beatsPerMinute }.toInt()
            )
        } catch (e: Exception) {
            Log.w(TAG, "Error reading heart rate data", e)
            null
        }
    }

    override suspend fun readRouteData(startTime: Instant, endTime: Instant): List<GpsPoint> {
        val client = healthConnectClient ?: return emptyList()
        return try {
            val response = client.readRecords(
                ReadRecordsRequest(
                    recordType = ExerciseSessionRecord::class,
                    timeRangeFilter = TimeRangeFilter.between(startTime, endTime)
                )
            )

            response.records.firstOrNull()?.exerciseRouteResult?.let { routeResult ->
                when (routeResult) {
                    is ExerciseRouteResult.Data -> {
                        routeResult.exerciseRoute.route.map { location ->
                            GpsPoint(
                                latitude = location.latitude,
                                longitude = location.longitude,
                                altitude = location.altitude?.inMeters
                            )
                        }
                    }
                    else -> emptyList()
                }
            } ?: emptyList()
        } catch (e: Exception) {
            Log.w(TAG, "Error reading route data", e)
            emptyList()
        }
    }

    private suspend fun readDistance(
        client: HealthConnectClient,
        startTime: Instant,
        endTime: Instant
    ): Double? {
        return try {
            val response = client.readRecords(
                ReadRecordsRequest(
                    recordType = DistanceRecord::class,
                    timeRangeFilter = TimeRangeFilter.between(startTime, endTime)
                )
            )
            response.records.sumOf { it.distance.inMeters }.takeIf { it > 0 }
        } catch (e: Exception) {
            Log.w(TAG, "Error reading distance", e)
            null
        }
    }

    private suspend fun readElevation(
        client: HealthConnectClient,
        startTime: Instant,
        endTime: Instant
    ): Double? {
        return try {
            val response = client.readRecords(
                ReadRecordsRequest(
                    recordType = ElevationGainedRecord::class,
                    timeRangeFilter = TimeRangeFilter.between(startTime, endTime)
                )
            )
            response.records.sumOf { it.elevation.inMeters }.takeIf { it > 0 }
        } catch (e: Exception) {
            Log.w(TAG, "Error reading elevation", e)
            null
        }
    }

    private suspend fun readCalories(
        client: HealthConnectClient,
        startTime: Instant,
        endTime: Instant
    ): Int? {
        return try {
            val response = client.readRecords(
                ReadRecordsRequest(
                    recordType = TotalCaloriesBurnedRecord::class,
                    timeRangeFilter = TimeRangeFilter.between(startTime, endTime)
                )
            )
            response.records.sumOf { it.energy.inKilocalories }.toInt().takeIf { it > 0 }
        } catch (e: Exception) {
            Log.w(TAG, "Error reading calories", e)
            null
        }
    }

    private suspend fun readCadence(
        client: HealthConnectClient,
        startTime: Instant,
        endTime: Instant
    ): Int? {
        return try {
            val response = client.readRecords(
                ReadRecordsRequest(
                    recordType = StepsCadenceRecord::class,
                    timeRangeFilter = TimeRangeFilter.between(startTime, endTime)
                )
            )
            val allSamples = response.records.flatMap { it.samples }
            if (allSamples.isEmpty()) return null
            allSamples.map { it.rate }.average().toInt()
        } catch (e: Exception) {
            Log.w(TAG, "Error reading cadence", e)
            null
        }
    }
}
