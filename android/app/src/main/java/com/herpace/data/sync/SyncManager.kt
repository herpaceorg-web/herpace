package com.herpace.data.sync

import android.content.Context
import android.content.SharedPreferences
import android.util.Log
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKeys
import androidx.work.BackoffPolicy
import androidx.work.Constraints
import androidx.work.ExistingPeriodicWorkPolicy
import androidx.work.ExistingWorkPolicy
import androidx.work.NetworkType
import androidx.work.OneTimeWorkRequestBuilder
import androidx.work.PeriodicWorkRequestBuilder
import androidx.work.WorkManager
import dagger.hilt.android.qualifiers.ApplicationContext
import java.util.concurrent.TimeUnit
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class SyncManager @Inject constructor(
    @ApplicationContext private val context: Context
) {
    companion object {
        private const val TAG = "SyncManager"
        private const val PERIODIC_SYNC_WORK = "herpace_periodic_sync"
        private const val ONE_TIME_SYNC_WORK = "herpace_one_time_sync"
        private const val SYNC_INTERVAL_HOURS = 1L
        private const val PREFS_NAME = "herpace_sync_prefs"
        private const val KEY_LAST_SYNC_TIME = "last_sync_time"
        private const val KEY_CONFLICT_COUNT = "last_conflict_count"
        private const val KEY_CONFLICT_TIMESTAMP = "last_conflict_timestamp"
    }

    private val workManager: WorkManager
        get() = WorkManager.getInstance(context)

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

    private val networkConstraints = Constraints.Builder()
        .setRequiredNetworkType(NetworkType.CONNECTED)
        .build()

    /**
     * T201: Main entry point to schedule sync work with network constraints.
     * Sets up periodic sync and triggers an initial immediate sync.
     * Call this after successful login or app startup when user is authenticated.
     */
    fun scheduleSyncWork() {
        schedulePeriodicSync()
        requestImmediateSync()
    }

    /**
     * Schedule periodic background sync that runs every hour when network is available.
     * Uses KEEP policy so it doesn't restart if already scheduled.
     */
    fun schedulePeriodicSync() {
        val syncRequest = PeriodicWorkRequestBuilder<SyncWorker>(
            SYNC_INTERVAL_HOURS, TimeUnit.HOURS
        )
            .setConstraints(networkConstraints)
            .setBackoffCriteria(BackoffPolicy.EXPONENTIAL, 30, TimeUnit.SECONDS)
            .addTag(SyncWorker.TAG)
            .build()

        workManager.enqueueUniquePeriodicWork(
            PERIODIC_SYNC_WORK,
            ExistingPeriodicWorkPolicy.KEEP,
            syncRequest
        )

        Log.d(TAG, "Periodic sync scheduled (every $SYNC_INTERVAL_HOURS hours)")
    }

    /**
     * Trigger an immediate one-time sync. Used after local writes
     * or when the user manually requests a sync.
     */
    fun requestImmediateSync() {
        val syncRequest = OneTimeWorkRequestBuilder<SyncWorker>()
            .setConstraints(networkConstraints)
            .setBackoffCriteria(BackoffPolicy.EXPONENTIAL, 15, TimeUnit.SECONDS)
            .addTag(SyncWorker.TAG)
            .build()

        workManager.enqueueUniqueWork(
            ONE_TIME_SYNC_WORK,
            ExistingWorkPolicy.REPLACE,
            syncRequest
        )

        Log.d(TAG, "Immediate sync requested")
    }

    /**
     * Cancel all sync work. Used on logout.
     */
    fun cancelAllSync() {
        workManager.cancelUniqueWork(PERIODIC_SYNC_WORK)
        workManager.cancelUniqueWork(ONE_TIME_SYNC_WORK)
        Log.d(TAG, "All sync work cancelled")
    }

    /**
     * Record the current time as the last successful sync time.
     * Called by SyncWorker after a successful sync.
     */
    fun recordLastSyncTime() {
        prefs.edit().putLong(KEY_LAST_SYNC_TIME, System.currentTimeMillis()).apply()
    }

    /**
     * Get the last successful sync time in milliseconds since epoch.
     * Returns null if no sync has been recorded.
     */
    fun getLastSyncTimeMillis(): Long? {
        val time = prefs.getLong(KEY_LAST_SYNC_TIME, -1L)
        return if (time == -1L) null else time
    }

    /**
     * Record that conflicts were resolved during sync (server wins).
     * The UI can read this to notify the user.
     */
    fun recordConflictsResolved(count: Int) {
        if (count > 0) {
            prefs.edit()
                .putInt(KEY_CONFLICT_COUNT, count)
                .putLong(KEY_CONFLICT_TIMESTAMP, System.currentTimeMillis())
                .apply()
            Log.d(TAG, "Recorded $count sync conflicts resolved (server wins)")
        }
    }

    /**
     * Get the number of conflicts resolved in the last sync, or 0 if none.
     */
    fun getLastConflictCount(): Int {
        return prefs.getInt(KEY_CONFLICT_COUNT, 0)
    }

    /**
     * Get the timestamp of when the last conflicts were resolved.
     */
    fun getLastConflictTimestamp(): Long? {
        val time = prefs.getLong(KEY_CONFLICT_TIMESTAMP, -1L)
        return if (time == -1L) null else time
    }

    /**
     * Clear conflict records after the user has been notified.
     */
    fun clearConflictRecords() {
        prefs.edit()
            .putInt(KEY_CONFLICT_COUNT, 0)
            .remove(KEY_CONFLICT_TIMESTAMP)
            .apply()
    }
}
