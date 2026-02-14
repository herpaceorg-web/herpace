package com.herpace.domain.usecase

import com.herpace.data.remote.ApiResult
import com.herpace.domain.repository.TrainingPlanRepository
import com.herpace.domain.repository.WorkoutLogRepository
import javax.inject.Inject

class UndoSessionCompletionUseCase @Inject constructor(
    private val trainingPlanRepository: TrainingPlanRepository,
    private val workoutLogRepository: WorkoutLogRepository
) {
    suspend operator fun invoke(sessionId: String): ApiResult<Unit> {
        // Undo the session completion status
        val result = trainingPlanRepository.undoMarkSessionCompleted(sessionId)
        if (result is ApiResult.Success) {
            // Also delete the associated workout log
            workoutLogRepository.deleteBySessionId(sessionId)
        }
        return result
    }
}
