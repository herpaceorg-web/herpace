package com.herpace.presentation.profile

import com.herpace.domain.model.CyclePhase
import com.herpace.domain.model.RunnerProfile

data class ProfileUiState(
    val profile: RunnerProfile? = null,
    val currentCyclePhase: CyclePhase? = null,
    val dayInCycle: Int? = null,
    val isLoading: Boolean = false,
    val errorMessage: String? = null,
    val periodLogSuccess: Boolean = false,
    val showLogPeriodConfirmation: Boolean = false,
    val isSyncing: Boolean = false,
    val lastSyncTimeMillis: Long? = null,
    val pendingSyncCount: Int = 0
)
