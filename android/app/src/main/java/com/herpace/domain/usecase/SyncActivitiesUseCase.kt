package com.herpace.domain.usecase

import android.content.Context
import android.content.SharedPreferences
import android.util.Log
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKeys
import com.herpace.data.remote.ApiResult
import com.herpace.data.remote.HerPaceApiService
import com.herpace.data.remote.dto.ActivityUploadItem
import com.herpace.data.remote.dto.ActivityUploadRequest
import com.herpace.data.remote.dto.GpsPointResponse
import com.herpace.data.remote.safeApiCall
import com.herpace.domain.repository.HealthConnectRepository
import dagger.hilt.android.qualifiers.ApplicationContext
import java.time.Instant
import java.time.ZoneOffset
import java.time.format.DateTimeFormatter
import javax.inject.Inject

class SyncActivitiesUseCase @Inject constructor(
    @ApplicationContext private val context: Context,
    private val healthConnectRepository: HealthConnectRepository,
    private val apiService: HerPaceApiService
) {
    companion object {
        private const val TAG = "SyncActivitiesUseCase"
        private const val PREFS_NAME = "herpace_health_connect_prefs"
        private const val KEY_LAST_SYNC_AT = "hc_last_sync_at"
        private const val DEFAULT_LOOKBACK_DAYS = 30L
        private const val MAX_BATCH_SIZE = 50
    }

    private val prefs: SharedPreferences by lazy {
        val masterKeyAlias = MasterKeys.getOrCreate(MasterKeys.AES256_GCM_SPEC)
        EncryptedSharedPreferences.create(
            PREFS_NAME,
            masterKeyAlias,
            context,
            EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
            EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
        )
    }

    data class SyncResult(
        val imported: Int = 0,
        val duplicates: Int = 0,
        val filtered: Int = 0,
        val error: String? = null
    )

    suspend operator fun invoke(): SyncResult {
        // Check permissions first
        if (!healthConnectRepository.hasPermissions()) {
            Log.w(TAG, "Health Connect permissions not granted")
            return SyncResult(error = "Health Connect permissions not granted")
        }

        val since = getLastSyncAt()
        Log.d(TAG, "Syncing activities since $since")

        val exercises = healthConnectRepository.readExerciseSessions(since)
        if (exercises.isEmpty()) {
            Log.d(TAG, "No new exercises found")
            updateLastSyncAt()
            return SyncResult()
        }

        Log.d(TAG, "Found ${exercises.size} exercises to sync")

        val formatter = DateTimeFormatter.ISO_INSTANT

        val uploadItems = exercises.map { exercise ->
            ActivityUploadItem(
                externalActivityId = exercise.id,
                activityDate = formatter.format(exercise.startTime.atOffset(ZoneOffset.UTC)),
                activityType = if (exercise.exerciseType == 57) "TreadmillRun" else "Run",
                distanceMeters = exercise.distanceMeters,
                durationSeconds = exercise.durationSeconds,
                averageHeartRate = exercise.averageHeartRate,
                maxHeartRate = exercise.maxHeartRate,
                cadence = exercise.cadence,
                elevationGainMeters = exercise.elevationGainMeters,
                caloriesBurned = exercise.caloriesBurned,
                gpsRoute = exercise.gpsRoute.takeIf { it.isNotEmpty() }?.map { point ->
                    GpsPointResponse(
                        lat = point.latitude,
                        lng = point.longitude,
                        altitude = point.altitude
                    )
                }
            )
        }

        // Upload in batches of MAX_BATCH_SIZE
        var totalImported = 0
        var totalDuplicates = 0
        var totalFiltered = 0

        uploadItems.chunked(MAX_BATCH_SIZE).forEach { batch ->
            val request = ActivityUploadRequest(activities = batch)
            when (val result = safeApiCall { apiService.uploadActivities(request) }) {
                is ApiResult.Success -> {
                    totalImported += result.data.imported
                    totalDuplicates += result.data.duplicates
                    totalFiltered += result.data.filtered
                    Log.d(TAG, "Batch uploaded: ${result.data.imported} imported, ${result.data.duplicates} duplicates")
                }
                is ApiResult.Error -> {
                    Log.e(TAG, "Upload failed: ${result.code} ${result.message}")
                    return SyncResult(
                        imported = totalImported,
                        duplicates = totalDuplicates,
                        filtered = totalFiltered,
                        error = result.message ?: "Upload failed"
                    )
                }
                is ApiResult.NetworkError -> {
                    Log.e(TAG, "Network error during upload")
                    return SyncResult(
                        imported = totalImported,
                        duplicates = totalDuplicates,
                        filtered = totalFiltered,
                        error = "Network error"
                    )
                }
            }
        }

        updateLastSyncAt()
        Log.d(TAG, "Sync complete: $totalImported imported, $totalDuplicates duplicates, $totalFiltered filtered")

        return SyncResult(
            imported = totalImported,
            duplicates = totalDuplicates,
            filtered = totalFiltered
        )
    }

    private fun getLastSyncAt(): Instant {
        val millis = prefs.getLong(KEY_LAST_SYNC_AT, -1L)
        return if (millis == -1L) {
            Instant.now().minusSeconds(DEFAULT_LOOKBACK_DAYS * 24 * 60 * 60)
        } else {
            Instant.ofEpochMilli(millis)
        }
    }

    private fun updateLastSyncAt() {
        prefs.edit().putLong(KEY_LAST_SYNC_AT, Instant.now().toEpochMilli()).apply()
    }
}
