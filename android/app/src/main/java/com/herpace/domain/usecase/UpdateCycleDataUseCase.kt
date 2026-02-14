package com.herpace.domain.usecase

import com.herpace.data.remote.ApiResult
import com.herpace.domain.model.RunnerProfile
import com.herpace.domain.repository.ProfileRepository
import java.time.Instant
import java.time.LocalDate
import javax.inject.Inject

class UpdateCycleDataUseCase @Inject constructor(
    private val profileRepository: ProfileRepository
) {
    suspend operator fun invoke(
        currentProfile: RunnerProfile,
        cycleLength: Int,
        lastPeriodStartDate: LocalDate
    ): ApiResult<RunnerProfile> {
        // Validation
        if (cycleLength !in 21..40) {
            return ApiResult.Error(-1, "Cycle length must be between 21 and 40 days")
        }
        if (lastPeriodStartDate.isAfter(LocalDate.now())) {
            return ApiResult.Error(-1, "Last period start date cannot be in the future")
        }
        if (lastPeriodStartDate.isBefore(LocalDate.now().minusDays(90))) {
            return ApiResult.Error(-1, "Last period start date cannot be more than 90 days ago")
        }

        val updatedProfile = currentProfile.copy(
            cycleLength = cycleLength,
            lastPeriodStartDate = lastPeriodStartDate,
            lastUpdated = Instant.now()
        )

        return profileRepository.saveProfile(updatedProfile)
    }
}
