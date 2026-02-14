package com.herpace.domain.usecase

import com.herpace.domain.model.TrainingSession
import com.herpace.domain.repository.TrainingPlanRepository
import java.time.LocalDate
import javax.inject.Inject

class GetSessionByDateUseCase @Inject constructor(
    private val trainingPlanRepository: TrainingPlanRepository
) {
    suspend operator fun invoke(date: LocalDate): List<TrainingSession> {
        return trainingPlanRepository.getSessionsByDate(date)
    }
}
