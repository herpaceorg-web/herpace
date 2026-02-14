package com.herpace.presentation.dashboard

import com.herpace.domain.model.TrainingPlan
import com.herpace.domain.model.TrainingSession

data class DashboardUiState(
    val todaySession: TrainingSession? = null,
    val activePlan: TrainingPlan? = null,
    val isLoading: Boolean = false,
    val errorMessage: String? = null,
    val showPeriodReminder: Boolean = false,
    val daysSinceLastPeriod: Int? = null,
    val lastSyncTimeMillis: Long? = null,
    val pendingSyncCount: Int = 0,
    val syncConflictsResolved: Int = 0,
    val isOffline: Boolean = false
)
