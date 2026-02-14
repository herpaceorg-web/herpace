package com.herpace.presentation.session

import com.herpace.domain.model.TrainingSession
import com.herpace.domain.model.WorkoutLog

data class SessionDetailUiState(
    val session: TrainingSession? = null,
    val workoutLog: WorkoutLog? = null,
    val isLoading: Boolean = false,
    val isMarkingComplete: Boolean = false,
    val isLoggingWorkout: Boolean = false,
    val showLogWorkoutDialog: Boolean = false,
    val errorMessage: String? = null
)
