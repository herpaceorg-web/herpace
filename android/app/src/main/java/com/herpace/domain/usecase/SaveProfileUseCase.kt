package com.herpace.domain.usecase

import com.herpace.data.remote.ApiResult
import com.herpace.domain.model.RunnerProfile
import com.herpace.domain.repository.ProfileRepository
import java.time.LocalDate
import javax.inject.Inject

class SaveProfileUseCase @Inject constructor(
    private val profileRepository: ProfileRepository
) {
    suspend operator fun invoke(profile: RunnerProfile): ApiResult<RunnerProfile> {
        val validationError = validate(profile)
        if (validationError != null) {
            return ApiResult.Error(-1, validationError)
        }
        return profileRepository.saveProfile(profile)
    }

    private fun validate(profile: RunnerProfile): String? {
        if (profile.name.isBlank()) {
            return "Name is required"
        }
        if (profile.name.length > 100) {
            return "Name must be 100 characters or less"
        }
        if (profile.age !in 13..120) {
            return "Age must be between 13 and 120"
        }
        if (profile.currentWeeklyMileage !in 0.0..250.0) {
            return "Weekly mileage must be between 0 and 250 km"
        }
        if (profile.cycleLength !in 21..40) {
            return "Cycle length must be between 21 and 40 days"
        }
        if (profile.lastPeriodStartDate.isAfter(LocalDate.now())) {
            return "Last period start date cannot be in the future"
        }
        if (profile.lastPeriodStartDate.isBefore(LocalDate.now().minusDays(90))) {
            return "Last period start date cannot be more than 90 days ago"
        }
        return null
    }
}
