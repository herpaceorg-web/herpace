package com.herpace.domain.usecase

import com.herpace.data.local.SyncStatus
import com.herpace.data.local.dao.RaceDao
import com.herpace.data.local.dao.RunnerProfileDao
import com.herpace.data.local.dao.TrainingSessionDao
import com.herpace.data.sync.SyncManager
import javax.inject.Inject

data class SyncStatusInfo(
    val pendingCount: Int,
    val lastSyncTimeMillis: Long?,
    val conflictsResolvedCount: Int = 0,
    val conflictsResolvedTimestamp: Long? = null
)

class GetSyncStatusUseCase @Inject constructor(
    private val runnerProfileDao: RunnerProfileDao,
    private val raceDao: RaceDao,
    private val trainingSessionDao: TrainingSessionDao,
    private val syncManager: SyncManager
) {
    suspend operator fun invoke(): SyncStatusInfo {
        val pendingProfiles = runnerProfileDao.countBySyncStatus(SyncStatus.NOT_SYNCED.name) +
            runnerProfileDao.countBySyncStatus(SyncStatus.SYNC_FAILED.name)
        val pendingRaces = raceDao.countBySyncStatus(SyncStatus.NOT_SYNCED.name) +
            raceDao.countBySyncStatus(SyncStatus.SYNC_FAILED.name)
        val pendingSessions = trainingSessionDao.countBySyncStatus(SyncStatus.NOT_SYNCED.name) +
            trainingSessionDao.countBySyncStatus(SyncStatus.SYNC_FAILED.name)

        return SyncStatusInfo(
            pendingCount = pendingProfiles + pendingRaces + pendingSessions,
            lastSyncTimeMillis = syncManager.getLastSyncTimeMillis(),
            conflictsResolvedCount = syncManager.getLastConflictCount(),
            conflictsResolvedTimestamp = syncManager.getLastConflictTimestamp()
        )
    }
}
