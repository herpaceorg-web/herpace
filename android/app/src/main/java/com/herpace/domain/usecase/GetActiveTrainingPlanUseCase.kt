package com.herpace.domain.usecase

import com.herpace.data.remote.ApiResult
import com.herpace.domain.model.TrainingPlan
import com.herpace.domain.repository.TrainingPlanRepository
import kotlinx.coroutines.flow.Flow
import javax.inject.Inject

class GetActiveTrainingPlanUseCase @Inject constructor(
    private val trainingPlanRepository: TrainingPlanRepository
) {
    suspend operator fun invoke(): ApiResult<TrainingPlan?> {
        return trainingPlanRepository.getActivePlan()
    }

    fun observe(): Flow<TrainingPlan?> {
        return trainingPlanRepository.observeActivePlan()
    }
}
