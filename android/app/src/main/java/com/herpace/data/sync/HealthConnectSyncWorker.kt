package com.herpace.data.sync

import android.content.Context
import android.util.Log
import androidx.hilt.work.HiltWorker
import androidx.work.BackoffPolicy
import androidx.work.Constraints
import androidx.work.CoroutineWorker
import androidx.work.ExistingPeriodicWorkPolicy
import androidx.work.NetworkType
import androidx.work.PeriodicWorkRequestBuilder
import androidx.work.WorkManager
import androidx.work.WorkerParameters
import com.herpace.data.repository.AuthTokenProvider
import com.herpace.domain.repository.HealthConnectAvailability
import com.herpace.domain.repository.HealthConnectRepository
import com.herpace.domain.usecase.SyncActivitiesUseCase
import dagger.assisted.Assisted
import dagger.assisted.AssistedInject
import java.util.concurrent.TimeUnit

@HiltWorker
class HealthConnectSyncWorker @AssistedInject constructor(
    @Assisted appContext: Context,
    @Assisted workerParams: WorkerParameters,
    private val healthConnectRepository: HealthConnectRepository,
    private val syncActivitiesUseCase: SyncActivitiesUseCase,
    private val authTokenProvider: AuthTokenProvider
) : CoroutineWorker(appContext, workerParams) {

    companion object {
        const val TAG = "HealthConnectSync"
        const val WORK_NAME = "herpace_health_connect_sync"
        private const val SYNC_INTERVAL_MINUTES = 30L

        fun schedule(context: Context) {
            val constraints = Constraints.Builder()
                .setRequiredNetworkType(NetworkType.CONNECTED)
                .build()

            val syncRequest = PeriodicWorkRequestBuilder<HealthConnectSyncWorker>(
                SYNC_INTERVAL_MINUTES, TimeUnit.MINUTES
            )
                .setConstraints(constraints)
                .setBackoffCriteria(BackoffPolicy.EXPONENTIAL, 5, TimeUnit.MINUTES)
                .addTag(TAG)
                .build()

            WorkManager.getInstance(context).enqueueUniquePeriodicWork(
                WORK_NAME,
                ExistingPeriodicWorkPolicy.KEEP,
                syncRequest
            )

            Log.d(TAG, "Health Connect periodic sync scheduled (every ${SYNC_INTERVAL_MINUTES}m)")
        }

        fun cancel(context: Context) {
            WorkManager.getInstance(context).cancelUniqueWork(WORK_NAME)
            Log.d(TAG, "Health Connect sync cancelled")
        }
    }

    override suspend fun doWork(): Result {
        if (!authTokenProvider.isLoggedIn()) {
            Log.d(TAG, "User not logged in, skipping Health Connect sync")
            return Result.success()
        }

        // Check Health Connect availability
        val availability = healthConnectRepository.checkAvailability()
        if (availability != HealthConnectAvailability.AVAILABLE) {
            Log.w(TAG, "Health Connect not available: $availability")
            return Result.success()
        }

        // Check permissions - if revoked, stop the periodic worker
        if (!healthConnectRepository.hasPermissions()) {
            Log.w(TAG, "Health Connect permissions revoked, cancelling periodic sync")
            cancel(applicationContext)
            return Result.success()
        }

        Log.d(TAG, "Starting Health Connect sync...")

        val result = syncActivitiesUseCase()

        return if (result.error != null) {
            Log.e(TAG, "Health Connect sync failed: ${result.error}")
            if (runAttemptCount < 3) {
                Result.retry()
            } else {
                Result.failure()
            }
        } else {
            Log.d(TAG, "Health Connect sync complete: ${result.imported} imported, ${result.duplicates} dupes")
            Result.success()
        }
    }
}
