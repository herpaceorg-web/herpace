package com.herpace.data.repository

import com.herpace.data.local.SyncStatus
import com.herpace.data.local.dao.TrainingPlanDao
import com.herpace.data.local.dao.TrainingSessionDao
import com.herpace.data.local.entity.TrainingPlanEntity
import com.herpace.data.local.entity.TrainingSessionEntity
import com.herpace.data.remote.ApiResult
import com.herpace.data.remote.HerPaceApiService
import com.herpace.data.remote.dto.GeneratePlanRequest
import com.herpace.data.remote.dto.TrainingPlanDetailResponse
import com.herpace.data.remote.dto.TrainingPlanResponse
import com.herpace.data.remote.dto.TrainingSessionResponse
import com.herpace.data.remote.safeApiCall
import com.herpace.data.remote.safeApiCallWithRetry
import com.herpace.data.sync.SyncManager
import com.herpace.domain.model.CyclePhase
import com.herpace.domain.model.IntensityLevel
import com.herpace.domain.model.TrainingPlan
import com.herpace.domain.model.TrainingSession
import com.herpace.domain.model.WorkoutType
import com.herpace.domain.repository.TrainingPlanRepository
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import java.time.DayOfWeek
import java.time.Instant
import java.time.LocalDate
import java.time.temporal.ChronoUnit
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class TrainingPlanRepositoryImpl @Inject constructor(
    private val apiService: HerPaceApiService,
    private val trainingPlanDao: TrainingPlanDao,
    private val trainingSessionDao: TrainingSessionDao,
    private val authTokenProvider: AuthTokenProvider,
    private val syncManager: SyncManager
) : TrainingPlanRepository {

    override suspend fun generatePlan(raceId: String): ApiResult<TrainingPlan> {
        val result = safeApiCall {
            apiService.generatePlan(GeneratePlanRequest(raceId))
        }
        return when (result) {
            is ApiResult.Success -> {
                // POST /api/plans returns PlanResponse (no sessions)
                // Follow up with GET /api/plans/active to get sessions
                val planResponse = result.data
                val detailResult = safeApiCall { apiService.getActivePlan() }

                val plan = if (detailResult is ApiResult.Success && detailResult.data != null) {
                    mapDetailResponseToDomain(detailResult.data)
                } else {
                    mapPlanResponseToDomain(planResponse)
                }

                val userId = authTokenProvider.getUserId()
                if (userId != null) {
                    trainingPlanDao.deactivateAllForUser(userId)
                }
                trainingPlanDao.insert(TrainingPlanEntity.fromDomain(plan.copy(isActive = true)))
                if (plan.sessions.isNotEmpty()) {
                    trainingSessionDao.insertAll(plan.sessions.map { TrainingSessionEntity.fromDomain(it) })
                }
                ApiResult.Success(plan.copy(isActive = true))
            }
            is ApiResult.Error -> result
            is ApiResult.NetworkError -> result
        }
    }

    override suspend fun getActivePlan(): ApiResult<TrainingPlan?> {
        val result = safeApiCallWithRetry { apiService.getActivePlan() }
        return when (result) {
            is ApiResult.Success -> {
                if (result.data != null) {
                    val plan = mapDetailResponseToDomain(result.data)
                    trainingPlanDao.insert(TrainingPlanEntity.fromDomain(plan))
                    trainingSessionDao.deleteByPlanId(plan.id)
                    trainingSessionDao.insertAll(plan.sessions.map { TrainingSessionEntity.fromDomain(it) })
                    ApiResult.Success(plan)
                } else {
                    ApiResult.Success(null)
                }
            }
            is ApiResult.Error -> fallbackToActiveCached()
            is ApiResult.NetworkError -> fallbackToActiveCached()
        }
    }

    override fun observeActivePlan(): Flow<TrainingPlan?> {
        val userId = authTokenProvider.getUserId()
            ?: return kotlinx.coroutines.flow.flowOf(null)
        return trainingPlanDao.observeActivePlan(userId).map { planEntity ->
            if (planEntity != null) {
                val sessions = trainingSessionDao.getByPlanId(planEntity.id)
                planEntity.toDomain(sessions.map { it.toDomain() })
            } else {
                null
            }
        }
    }

    override suspend fun getSessionsByPlanId(planId: String): ApiResult<List<TrainingSession>> {
        val sessions = trainingSessionDao.getByPlanId(planId)
        return ApiResult.Success(sessions.map { it.toDomain() })
    }

    override fun observeSessionsByPlanId(planId: String): Flow<List<TrainingSession>> {
        return trainingSessionDao.observeByPlanId(planId).map { entities ->
            entities.map { it.toDomain() }
        }
    }

    override suspend fun getSessionsByWeek(planId: String, weekNumber: Int): List<TrainingSession> {
        return trainingSessionDao.getByWeek(planId, weekNumber).map { it.toDomain() }
    }

    override fun observeSessionsByWeek(planId: String, weekNumber: Int): Flow<List<TrainingSession>> {
        return trainingSessionDao.observeByWeek(planId, weekNumber).map { entities ->
            entities.map { it.toDomain() }
        }
    }

    override suspend fun getSessionById(sessionId: String): TrainingSession? {
        return trainingSessionDao.getById(sessionId)?.toDomain()
    }

    override suspend fun markSessionCompleted(sessionId: String): ApiResult<Unit> {
        trainingSessionDao.markCompleted(sessionId, Instant.now().toEpochMilli())
        trainingSessionDao.updateSyncStatus(sessionId, SyncStatus.NOT_SYNCED.name)
        syncManager.requestImmediateSync()
        return ApiResult.Success(Unit)
    }

    override suspend fun undoMarkSessionCompleted(sessionId: String): ApiResult<Unit> {
        trainingSessionDao.undoCompleted(sessionId)
        trainingSessionDao.updateSyncStatus(sessionId, SyncStatus.NOT_SYNCED.name)
        syncManager.requestImmediateSync()
        return ApiResult.Success(Unit)
    }

    override suspend fun getSessionsByDate(date: LocalDate): List<TrainingSession> {
        val userId = authTokenProvider.getUserId() ?: return emptyList()
        val activePlan = trainingPlanDao.getActivePlan(userId) ?: return emptyList()
        val dateStr = date.toString()
        return trainingSessionDao.getByDate(activePlan.id, dateStr).map { it.toDomain() }
    }

    private suspend fun fallbackToActiveCached(): ApiResult<TrainingPlan?> {
        val userId = authTokenProvider.getUserId()
        return if (userId != null) {
            val cached = trainingPlanDao.getActivePlan(userId)
            if (cached != null) {
                val sessions = trainingSessionDao.getByPlanId(cached.id)
                ApiResult.Success(cached.toDomain(sessions.map { it.toDomain() }))
            } else {
                ApiResult.Success(null)
            }
        } else {
            ApiResult.Success(null)
        }
    }

    private fun mapPlanResponseToDomain(response: TrainingPlanResponse): TrainingPlan {
        val startDate = parseDate(response.startDate)
        val endDate = parseDate(response.endDate)
        val totalWeeks = ((ChronoUnit.DAYS.between(startDate, endDate) / 7) + 1).toInt()

        return TrainingPlan(
            id = response.id,
            raceId = response.raceId,
            userId = authTokenProvider.getUserId() ?: response.runnerId ?: "",
            startDate = startDate,
            endDate = endDate,
            generatedAt = parseInstant(response.createdAt),
            totalWeeks = totalWeeks,
            isActive = true,
            sessions = emptyList()
        )
    }

    private fun mapDetailResponseToDomain(response: TrainingPlanDetailResponse): TrainingPlan {
        val startDate = parseDate(response.startDate)
        val endDate = parseDate(response.endDate)
        val sessions = response.sessions.map { mapSessionResponseToDomain(it, response.id, startDate) }
        val totalWeeks = if (sessions.isNotEmpty()) {
            sessions.maxOf { it.weekNumber }
        } else {
            ((ChronoUnit.DAYS.between(startDate, endDate) / 7) + 1).toInt()
        }

        return TrainingPlan(
            id = response.id,
            raceId = response.raceId,
            userId = authTokenProvider.getUserId() ?: response.runnerId ?: "",
            startDate = startDate,
            endDate = endDate,
            generatedAt = parseInstant(response.createdAt),
            totalWeeks = totalWeeks,
            isActive = response.status == 0, // PlanStatus.Active
            sessions = sessions
        )
    }

    private fun mapSessionResponseToDomain(
        response: TrainingSessionResponse,
        planId: String,
        planStartDate: LocalDate
    ): TrainingSession {
        val sessionDate = parseDate(response.scheduledDate)
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
            completedAt = response.completedAt?.let { parseInstant(it) }
        )
    }

    private fun parseDate(dateStr: String): LocalDate {
        return try {
            LocalDate.parse(dateStr.substringBefore("T"))
        } catch (_: Exception) {
            LocalDate.now()
        }
    }

    private fun parseInstant(dateStr: String?): Instant {
        return try {
            Instant.parse(dateStr ?: return Instant.now())
        } catch (_: Exception) {
            Instant.now()
        }
    }
}
