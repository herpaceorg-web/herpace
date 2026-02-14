package com.herpace.domain.usecase

import com.herpace.domain.model.TrainingSession
import com.herpace.domain.repository.TrainingPlanRepository
import java.time.LocalDate
import javax.inject.Inject

class GetTodaySessionUseCase @Inject constructor(
    private val trainingPlanRepository: TrainingPlanRepository
) {
    suspend operator fun invoke(): TrainingSession? {
        return trainingPlanRepository.getSessionsByDate(LocalDate.now()).firstOrNull()
    }
}
