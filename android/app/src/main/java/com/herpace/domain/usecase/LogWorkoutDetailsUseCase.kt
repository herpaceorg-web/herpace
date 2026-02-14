package com.herpace.domain.usecase

import com.herpace.domain.model.FitnessPlatform
import com.herpace.domain.model.WorkoutLog
import com.herpace.domain.repository.WorkoutLogRepository
import java.util.UUID
import javax.inject.Inject

class LogWorkoutDetailsUseCase @Inject constructor(
    private val workoutLogRepository: WorkoutLogRepository
) {
    suspend operator fun invoke(
        sessionId: String,
        userId: String,
        actualDistanceKm: Double,
        actualDurationMinutes: Int,
        perceivedEffort: Int,
        notes: String? = null,
        importedFrom: FitnessPlatform? = null
    ): Result<WorkoutLog> {
        // Validation
        if (actualDistanceKm < 0.0 || actualDistanceKm > 100.0) {
            return Result.failure(IllegalArgumentException("Distance must be between 0 and 100 km"))
        }
        if (actualDurationMinutes < 1 || actualDurationMinutes > 600) {
            return Result.failure(IllegalArgumentException("Duration must be between 1 and 600 minutes"))
        }
        if (perceivedEffort < 1 || perceivedEffort > 10) {
            return Result.failure(IllegalArgumentException("Perceived effort must be between 1 and 10"))
        }

        val log = WorkoutLog(
            id = UUID.randomUUID().toString(),
            sessionId = sessionId,
            userId = userId,
            actualDistanceKm = actualDistanceKm,
            actualDurationMinutes = actualDurationMinutes,
            perceivedEffort = perceivedEffort,
            notes = notes,
            importedFrom = importedFrom
        )

        workoutLogRepository.logWorkout(log)
        return Result.success(log)
    }
}
