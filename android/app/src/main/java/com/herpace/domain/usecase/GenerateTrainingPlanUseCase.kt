package com.herpace.domain.usecase

import com.herpace.data.remote.ApiResult
import com.herpace.domain.model.TrainingPlan
import com.herpace.domain.repository.TrainingPlanRepository
import kotlinx.coroutines.withTimeout
import javax.inject.Inject

class GenerateTrainingPlanUseCase @Inject constructor(
    private val trainingPlanRepository: TrainingPlanRepository
) {
    suspend operator fun invoke(raceId: String): ApiResult<TrainingPlan> {
        if (raceId.isBlank()) {
            return ApiResult.Error(-1, "Race ID is required")
        }

        return try {
            withTimeout(GENERATION_TIMEOUT_MS) {
                trainingPlanRepository.generatePlan(raceId)
            }
        } catch (e: kotlinx.coroutines.TimeoutCancellationException) {
            ApiResult.Error(-1, "Plan generation timed out. Please try again.")
        }
    }

    companion object {
        private const val GENERATION_TIMEOUT_MS = 240_000L
    }
}
