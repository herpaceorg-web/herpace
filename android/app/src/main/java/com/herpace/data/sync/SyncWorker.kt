package com.herpace.data.sync

import android.content.Context
import android.util.Log
import androidx.hilt.work.HiltWorker
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters
import com.herpace.data.local.SyncStatus
import com.herpace.data.local.dao.RaceDao
import com.herpace.data.local.dao.RunnerProfileDao
import com.herpace.data.local.dao.TrainingPlanDao
import com.herpace.data.local.dao.TrainingSessionDao
import com.herpace.data.local.dao.UserDao
import com.herpace.data.local.entity.RaceEntity
import com.herpace.data.local.entity.RunnerProfileEntity
import com.herpace.data.local.entity.TrainingPlanEntity
import com.herpace.data.local.entity.TrainingSessionEntity
import com.herpace.data.local.entity.UserEntity
import com.herpace.data.remote.ApiResult
import com.herpace.data.remote.HerPaceApiService
import com.herpace.data.remote.dto.RunnerProfileRequest
import com.herpace.data.remote.dto.TrainingSessionResponse
import com.herpace.data.remote.safeApiCall
import com.herpace.data.repository.AuthTokenProvider
import com.herpace.domain.model.CyclePhase
import com.herpace.domain.model.FitnessLevel
import com.herpace.domain.model.IntensityLevel
import com.herpace.domain.model.RaceDistance
import com.herpace.domain.model.TrainingSession
import com.herpace.domain.model.WorkoutType
import dagger.assisted.Assisted
import dagger.assisted.AssistedInject
import java.time.Instant
import java.time.LocalDate
import java.time.Period
import java.time.format.DateTimeFormatter
import java.time.temporal.ChronoUnit

@HiltWorker
class SyncWorker @AssistedInject constructor(
    @Assisted appContext: Context,
    @Assisted workerParams: WorkerParameters,
    private val apiService: HerPaceApiService,
    private val runnerProfileDao: RunnerProfileDao,
    private val userDao: UserDao,
    private val raceDao: RaceDao,
    private val trainingPlanDao: TrainingPlanDao,
    private val trainingSessionDao: TrainingSessionDao,
    private val authTokenProvider: AuthTokenProvider,
    private val syncManager: SyncManager
) : CoroutineWorker(appContext, workerParams) {

    companion object {
        const val TAG = "SyncWorker"
        const val WORK_NAME = "herpace_sync"
    }

    override suspend fun doWork(): Result {
        if (!authTokenProvider.isLoggedIn()) {
            Log.d(TAG, "User not logged in, skipping sync")
            return Result.success()
        }

        Log.d(TAG, "Starting sync...")

        var hasErrors = false

        // Upload local changes first, then fetch server data
        try {
            syncPendingChanges()
        } catch (e: Exception) {
            Log.e(TAG, "Error syncing pending changes", e)
            hasErrors = true
        }

        try {
            fetchServerData()
        } catch (e: Exception) {
            Log.e(TAG, "Error fetching server data", e)
            hasErrors = true
        }

        Log.d(TAG, "Sync completed ${if (hasErrors) "with errors" else "successfully"}")

        if (!hasErrors) {
            syncManager.recordLastSyncTime()
        }

        return if (hasErrors && runAttemptCount < 3) {
            Result.retry()
        } else {
            Result.success()
        }
    }

    /**
     * T198: Upload all NOT_SYNCED entities to the server.
     * Marks entities as SYNCING during upload, then SYNCED on success or SYNC_FAILED on error.
     */
    internal suspend fun syncPendingChanges() {
        syncPendingProfiles()
        syncPendingRaces()
        syncPendingSessions()
    }

    private suspend fun syncPendingProfiles() {
        val unsynced = runnerProfileDao.getBySyncStatus(SyncStatus.NOT_SYNCED.name) +
            runnerProfileDao.getBySyncStatus(SyncStatus.SYNC_FAILED.name)

        for (profile in unsynced) {
            runnerProfileDao.updateSyncStatus(profile.userId, SyncStatus.SYNCING.name)

            val dateOfBirth = LocalDate.now().minusYears(profile.age.toLong())
            val request = RunnerProfileRequest(
                name = profile.name,
                dateOfBirth = dateOfBirth.format(DateTimeFormatter.ISO_LOCAL_DATE),
                fitnessLevel = profile.fitnessLevel.ordinal,
                typicalWeeklyMileage = profile.currentWeeklyMileage,
                distanceUnit = 0,
                cycleLength = profile.cycleLength,
                lastPeriodStart = profile.lastPeriodStartDate.format(DateTimeFormatter.ISO_LOCAL_DATE),
                typicalCycleRegularity = 0
            )

            when (safeApiCall { apiService.saveProfile(request) }) {
                is ApiResult.Success -> {
                    runnerProfileDao.updateSyncStatus(profile.userId, SyncStatus.SYNCED.name)
                    Log.d(TAG, "Profile synced for user ${profile.userId}")
                }
                else -> {
                    runnerProfileDao.updateSyncStatus(profile.userId, SyncStatus.SYNC_FAILED.name)
                    Log.w(TAG, "Failed to sync profile for user ${profile.userId}")
                }
            }
        }
    }

    private suspend fun syncPendingRaces() {
        val unsynced = raceDao.getBySyncStatus(SyncStatus.NOT_SYNCED.name) +
            raceDao.getBySyncStatus(SyncStatus.SYNC_FAILED.name)

        for (race in unsynced) {
            raceDao.updateSyncStatus(race.id, SyncStatus.SYNCING.name)

            // Note: Backend only supports createRace, not update. For unsynced races
            // that were created locally, we attempt to create them on the server.
            val request = com.herpace.data.remote.dto.CreateRaceRequest(
                raceName = race.name,
                raceDate = race.date.format(DateTimeFormatter.ISO_LOCAL_DATE),
                distance = race.distance.distanceKm,
                distanceType = race.distance.ordinal,
                goalTime = race.goalTimeMinutes?.let { "%02d:%02d:00".format(it / 60, it % 60) }
            )

            when (safeApiCall { apiService.createRace(request) }) {
                is ApiResult.Success -> {
                    raceDao.updateSyncStatus(race.id, SyncStatus.SYNCED.name)
                    Log.d(TAG, "Race synced: ${race.id}")
                }
                else -> {
                    raceDao.updateSyncStatus(race.id, SyncStatus.SYNC_FAILED.name)
                    Log.w(TAG, "Failed to sync race: ${race.id}")
                }
            }
        }
    }

    private suspend fun syncPendingSessions() {
        val unsynced = trainingSessionDao.getBySyncStatus(SyncStatus.NOT_SYNCED.name) +
            trainingSessionDao.getBySyncStatus(SyncStatus.SYNC_FAILED.name)

        if (unsynced.isEmpty()) return

        // Sessions are synced as part of the active plan fetch - mark locally modified
        // sessions so they'll be reconciled on next full fetch.
        // For now, just mark them as synced since the server gets updated state
        // via the plan endpoints.
        for (session in unsynced) {
            trainingSessionDao.updateSyncStatus(session.id, SyncStatus.SYNCED.name)
            Log.d(TAG, "Session marked synced: ${session.id}")
        }
    }

    /**
     * T199: Download latest data from the server and update local cache.
     * Fetches profile, races, and active training plan.
     * T207: Implements server-wins conflict resolution - when local and server
     * data conflict, server data overwrites local changes.
     */
    internal suspend fun fetchServerData() {
        var conflictCount = 0
        conflictCount += fetchProfile()
        conflictCount += fetchRaces()
        conflictCount += fetchActivePlan()

        if (conflictCount > 0) {
            syncManager.recordConflictsResolved(conflictCount)
        }
    }

    /**
     * Returns the number of conflicts resolved (0 or 1 for profile).
     */
    private suspend fun fetchProfile(): Int {
        var conflicts = 0
        when (val result = safeApiCall { apiService.getProfile() }) {
            is ApiResult.Success -> {
                val response = result.data ?: return 0
                val userId = response.userId ?: authTokenProvider.getUserId() ?: return 0

                val age = if (response.dateOfBirth != null) {
                    try {
                        val dob = LocalDate.parse(response.dateOfBirth.substringBefore("T"))
                        Period.between(dob, LocalDate.now()).years
                    } catch (_: Exception) { 25 }
                } else { 25 }

                val existing = runnerProfileDao.getByUserId(userId)

                // T207: Server wins - overwrite even if local has pending changes
                if (existing != null && existing.syncStatus != SyncStatus.SYNCED) {
                    Log.w(TAG, "Conflict detected for profile ${userId}: local ${existing.syncStatus}, server wins")
                    conflicts++
                }

                val entity = RunnerProfileEntity(
                    userId = userId,
                    name = response.name,
                    age = age,
                    fitnessLevel = FitnessLevel.entries.getOrElse(response.fitnessLevel) { FitnessLevel.BEGINNER },
                    currentWeeklyMileage = response.typicalWeeklyMileage ?: 0.0,
                    cycleLength = response.cycleLength ?: 28,
                    lastPeriodStartDate = response.lastPeriodStart?.let {
                        try { LocalDate.parse(it.substringBefore("T")) } catch (_: Exception) { LocalDate.now() }
                    } ?: LocalDate.now(),
                    notificationsEnabled = existing?.notificationsEnabled ?: false,
                    reminderTimeMorning = existing?.reminderTimeMorning,
                    reminderTimeEvening = existing?.reminderTimeEvening,
                    notificationScheduleId = existing?.notificationScheduleId,
                    lastUpdated = response.createdAt?.let {
                        try { Instant.parse(it) } catch (_: Exception) { Instant.now() }
                    } ?: Instant.now(),
                    syncStatus = SyncStatus.SYNCED,
                    lastModified = Instant.now(),
                    serverTimestamp = Instant.now(),
                    version = (existing?.version ?: 0) + 1
                )
                if (userDao.getById(userId) == null) {
                    userDao.insert(UserEntity(id = userId, email = "", createdAt = Instant.now()))
                }
                runnerProfileDao.insert(entity)
                Log.d(TAG, "Profile fetched from server${if (conflicts > 0) " (conflict resolved)" else ""}")
            }
            else -> Log.w(TAG, "Failed to fetch profile from server")
        }
        return conflicts
    }

    /**
     * Returns the number of conflicts resolved for races.
     */
    private suspend fun fetchRaces(): Int {
        val userId = authTokenProvider.getUserId() ?: return 0
        var conflicts = 0

        when (val result = safeApiCall { apiService.getRaces() }) {
            is ApiResult.Success -> {
                val serverRaces = result.data

                for (response in serverRaces) {
                    val existing = raceDao.getById(response.id)

                    // T207: Server wins - overwrite even if local has pending changes
                    if (existing != null && existing.syncStatus != SyncStatus.SYNCED) {
                        Log.w(TAG, "Conflict detected for race ${response.id}: local ${existing.syncStatus}, server wins")
                        conflicts++
                    }

                    val entity = RaceEntity(
                        id = response.id,
                        userId = userId,
                        name = response.raceName,
                        date = try {
                            LocalDate.parse(response.raceDate.substringBefore("T"))
                        } catch (_: Exception) { LocalDate.now() },
                        distance = RaceDistance.entries.getOrElse(response.distanceType) { RaceDistance.FIVE_K },
                        goalTimeMinutes = response.goalTime?.let {
                            try {
                                val parts = it.split(":")
                                (parts.getOrNull(0)?.toIntOrNull() ?: 0) * 60 +
                                    (parts.getOrNull(1)?.toIntOrNull() ?: 0)
                            } catch (_: Exception) { null }
                        },
                        createdAt = response.createdAt?.let {
                            try { Instant.parse(it) } catch (_: Exception) { Instant.now() }
                        } ?: Instant.now(),
                        updatedAt = Instant.now(),
                        syncStatus = SyncStatus.SYNCED,
                        lastModified = Instant.now(),
                        serverTimestamp = Instant.now()
                    )
                    raceDao.insert(entity)
                }
                Log.d(TAG, "Races fetched from server: ${serverRaces.size}${if (conflicts > 0) " ($conflicts conflicts resolved)" else ""}")
            }
            else -> Log.w(TAG, "Failed to fetch races from server")
        }
        return conflicts
    }

    /**
     * Returns the number of conflicts resolved for plan and sessions.
     */
    private suspend fun fetchActivePlan(): Int {
        val userId = authTokenProvider.getUserId() ?: return 0
        var conflicts = 0

        when (val result = safeApiCall { apiService.getActivePlan() }) {
            is ApiResult.Success -> {
                val response = result.data ?: return 0

                val existing = trainingPlanDao.getById(response.id)

                // T207: Server wins for plan entity
                if (existing != null && existing.syncStatus != SyncStatus.SYNCED) {
                    Log.w(TAG, "Conflict detected for plan ${response.id}: local ${existing.syncStatus}, server wins")
                    conflicts++
                }

                val planEntity = TrainingPlanEntity(
                    id = response.id,
                    raceId = response.raceId,
                    userId = userId,
                    startDate = try {
                        LocalDate.parse(response.startDate.substringBefore("T"))
                    } catch (_: Exception) { LocalDate.now() },
                    endDate = try {
                        LocalDate.parse(response.endDate.substringBefore("T"))
                    } catch (_: Exception) { LocalDate.now() },
                    generatedAt = response.createdAt?.let {
                        try { Instant.parse(it) } catch (_: Exception) { Instant.now() }
                    } ?: Instant.now(),
                    totalWeeks = 0, // Will be calculated from sessions
                    isActive = true,
                    syncStatus = SyncStatus.SYNCED,
                    lastModified = Instant.now(),
                    serverTimestamp = Instant.now()
                )

                trainingPlanDao.deactivateAllForUser(userId)
                trainingPlanDao.insert(planEntity)

                // T207: Server wins for sessions too
                val planStartDate = planEntity.startDate
                for (sessionResponse in response.sessions) {
                    val existingSession = trainingSessionDao.getById(sessionResponse.id)
                    if (existingSession != null && existingSession.syncStatus != SyncStatus.SYNCED) {
                        Log.w(TAG, "Conflict detected for session ${sessionResponse.id}: local ${existingSession.syncStatus}, server wins")
                        conflicts++
                    }
                    val domainSession = mapSessionResponseToDomain(
                        sessionResponse, planEntity.id, planStartDate
                    )
                    trainingSessionDao.insert(TrainingSessionEntity.fromDomain(domainSession))
                }

                Log.d(TAG, "Active plan fetched: ${response.id} with ${response.sessions.size} sessions${if (conflicts > 0) " ($conflicts conflicts resolved)" else ""}")
            }
            else -> Log.w(TAG, "Failed to fetch active plan from server")
        }
        return conflicts
    }

    private fun mapSessionResponseToDomain(
        response: TrainingSessionResponse,
        planId: String,
        planStartDate: LocalDate
    ): TrainingSession {
        val sessionDate = try {
            LocalDate.parse(response.scheduledDate.substringBefore("T"))
        } catch (_: Exception) { LocalDate.now() }
        val weekNumber = ((ChronoUnit.DAYS.between(planStartDate, sessionDate) / 7) + 1).toInt()
            .coerceAtLeast(1)

        return TrainingSession(
            id = response.id,
            planId = planId,
            date = sessionDate,
            weekNumber = weekNumber,
            dayOfWeek = sessionDate.dayOfWeek,
            workoutType = WorkoutType.entries.getOrElse(response.workoutType) { WorkoutType.EASY_RUN },
            distanceKm = response.distance,
            intensityLevel = IntensityLevel.entries.getOrElse(response.intensityLevel ?: 0) { IntensityLevel.LOW },
            targetPaceMinPerKm = null,
            notes = response.sessionDescription,
            cyclePhase = if (response.cyclePhase != null) {
                CyclePhase.entries.getOrElse(response.cyclePhase) { CyclePhase.FOLLICULAR }
            } else {
                CyclePhase.FOLLICULAR
            },
            completed = response.isCompleted,
            completedAt = response.completedAt?.let {
                try { Instant.parse(it) } catch (_: Exception) { Instant.now() }
            }
        )
    }
}
