package com.herpace.domain.usecase

import com.herpace.domain.model.TrainingSession
import com.herpace.domain.repository.TrainingPlanRepository
import kotlinx.coroutines.flow.Flow
import javax.inject.Inject

class GetSessionsByWeekUseCase @Inject constructor(
    private val trainingPlanRepository: TrainingPlanRepository
) {
    suspend operator fun invoke(planId: String, weekNumber: Int): List<TrainingSession> {
        return trainingPlanRepository.getSessionsByWeek(planId, weekNumber)
    }

    fun observe(planId: String, weekNumber: Int): Flow<List<TrainingSession>> {
        return trainingPlanRepository.observeSessionsByWeek(planId, weekNumber)
    }
}
