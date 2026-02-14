package com.herpace.data.repository

import com.herpace.data.local.SyncStatus
import com.herpace.data.local.dao.RunnerProfileDao
import com.herpace.data.local.dao.UserDao
import com.herpace.data.local.entity.RunnerProfileEntity
import com.herpace.data.local.entity.UserEntity
import com.herpace.data.remote.ApiResult
import com.herpace.data.remote.HerPaceApiService
import com.herpace.data.remote.dto.RunnerProfileRequest
import com.herpace.data.remote.dto.RunnerProfileResponse
import com.herpace.data.remote.safeApiCall
import com.herpace.data.remote.safeApiCallWithRetry
import com.herpace.data.sync.SyncManager
import com.herpace.domain.model.FitnessLevel
import com.herpace.domain.model.RunnerProfile
import com.herpace.domain.repository.ProfileRepository
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import java.time.Instant
import java.time.LocalDate
import java.time.LocalTime
import java.time.Period
import java.time.format.DateTimeFormatter
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class ProfileRepositoryImpl @Inject constructor(
    private val apiService: HerPaceApiService,
    private val runnerProfileDao: RunnerProfileDao,
    private val userDao: UserDao,
    private val authTokenProvider: AuthTokenProvider,
    private val syncManager: SyncManager
) : ProfileRepository {

    override suspend fun saveProfile(profile: RunnerProfile): ApiResult<RunnerProfile> {
        val dateOfBirth = LocalDate.now().minusYears(profile.age.toLong())
        val request = RunnerProfileRequest(
            name = profile.name,
            dateOfBirth = dateOfBirth.format(DateTimeFormatter.ISO_LOCAL_DATE),
            fitnessLevel = profile.fitnessLevel.ordinal,
            typicalWeeklyMileage = profile.currentWeeklyMileage,
            distanceUnit = 0, // Kilometers
            cycleLength = profile.cycleLength,
            lastPeriodStart = profile.lastPeriodStartDate.format(DateTimeFormatter.ISO_LOCAL_DATE),
            typicalCycleRegularity = 0 // Regular
        )

        val result = safeApiCall { apiService.saveProfile(request) }

        return when (result) {
            is ApiResult.Success -> {
                val savedProfile = mapResponseToDomain(result.data)
                ensureUserExists(savedProfile.userId)
                runnerProfileDao.insert(RunnerProfileEntity.fromDomain(savedProfile, SyncStatus.SYNCED))
                ApiResult.Success(savedProfile)
            }
            is ApiResult.Error -> {
                // Save locally as NOT_SYNCED for later sync
                ensureUserExists(profile.userId)
                runnerProfileDao.insert(RunnerProfileEntity.fromDomain(profile, SyncStatus.NOT_SYNCED))
                syncManager.requestImmediateSync()
                ApiResult.Success(profile)
            }
            is ApiResult.NetworkError -> {
                // Save locally as NOT_SYNCED for later sync
                ensureUserExists(profile.userId)
                runnerProfileDao.insert(RunnerProfileEntity.fromDomain(profile, SyncStatus.NOT_SYNCED))
                syncManager.requestImmediateSync()
                ApiResult.Success(profile)
            }
        }
    }

    override suspend fun getProfile(): ApiResult<RunnerProfile?> {
        val result = safeApiCallWithRetry { apiService.getProfile() }

        return when (result) {
            is ApiResult.Success -> {
                val response = result.data
                if (response != null) {
                    val profile = mapResponseToDomain(response)
                    ensureUserExists(profile.userId)
                    runnerProfileDao.insert(RunnerProfileEntity.fromDomain(profile))
                    ApiResult.Success(profile)
                } else {
                    ApiResult.Success(null)
                }
            }
            is ApiResult.Error -> {
                val userId = authTokenProvider.getUserId()
                if (userId != null) {
                    val cached = runnerProfileDao.getByUserId(userId)
                    ApiResult.Success(cached?.toDomain())
                } else {
                    result
                }
            }
            is ApiResult.NetworkError -> {
                val userId = authTokenProvider.getUserId()
                if (userId != null) {
                    val cached = runnerProfileDao.getByUserId(userId)
                    ApiResult.Success(cached?.toDomain())
                } else {
                    result
                }
            }
        }
    }

    override fun observeProfile(): Flow<RunnerProfile?> {
        val userId = authTokenProvider.getUserId() ?: return kotlinx.coroutines.flow.flowOf(null)
        return runnerProfileDao.observeByUserId(userId).map { it?.toDomain() }
    }

    private suspend fun ensureUserExists(userId: String) {
        if (userDao.getById(userId) == null) {
            userDao.insert(UserEntity(id = userId, email = "", createdAt = Instant.now()))
        }
    }

    private fun mapResponseToDomain(response: RunnerProfileResponse): RunnerProfile {
        val age = if (response.dateOfBirth != null) {
            try {
                val dob = LocalDate.parse(response.dateOfBirth.substringBefore("T"))
                Period.between(dob, LocalDate.now()).years
            } catch (_: Exception) {
                25
            }
        } else {
            25
        }

        return RunnerProfile(
            userId = response.userId ?: authTokenProvider.getUserId() ?: "",
            name = response.name,
            age = age,
            fitnessLevel = FitnessLevel.entries.getOrElse(response.fitnessLevel) { FitnessLevel.BEGINNER },
            currentWeeklyMileage = response.typicalWeeklyMileage ?: 0.0,
            cycleLength = response.cycleLength ?: 28,
            lastPeriodStartDate = if (response.lastPeriodStart != null) {
                try {
                    LocalDate.parse(response.lastPeriodStart.substringBefore("T"))
                } catch (_: Exception) {
                    LocalDate.now()
                }
            } else {
                LocalDate.now()
            },
            notificationsEnabled = false,
            lastUpdated = if (response.createdAt != null) {
                try {
                    Instant.parse(response.createdAt)
                } catch (_: Exception) {
                    Instant.now()
                }
            } else {
                Instant.now()
            }
        )
    }
}
