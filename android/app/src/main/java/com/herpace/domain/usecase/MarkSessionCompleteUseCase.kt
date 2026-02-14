package com.herpace.domain.usecase

import com.herpace.data.remote.ApiResult
import com.herpace.domain.repository.TrainingPlanRepository
import javax.inject.Inject

class MarkSessionCompleteUseCase @Inject constructor(
    private val trainingPlanRepository: TrainingPlanRepository
) {
    suspend operator fun invoke(sessionId: String): ApiResult<Unit> {
        return trainingPlanRepository.markSessionCompleted(sessionId)
    }
}
