package com.herpace.presentation.plan

import com.herpace.domain.model.TrainingPlan
import com.herpace.domain.model.TrainingSession

data class TrainingPlanUiState(
    val plan: TrainingPlan? = null,
    val sessionsByWeek: Map<Int, List<TrainingSession>> = emptyMap(),
    val selectedWeek: Int = 1,
    val isLoading: Boolean = false,
    val isGenerating: Boolean = false,
    val errorMessage: String? = null,
    val generationSuccess: Boolean = false
)
