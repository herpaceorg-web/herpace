package com.herpace.presentation.profile

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.herpace.data.remote.ApiResult
import com.herpace.data.repository.AuthTokenProvider
import com.herpace.data.sync.SyncManager
import com.herpace.domain.model.CyclePhase
import com.herpace.domain.repository.ProfileRepository
import com.herpace.domain.usecase.GetSyncStatusUseCase
import com.herpace.domain.usecase.RecalculateCyclePhasesUseCase
import com.herpace.domain.usecase.SyncDataUseCase
import com.herpace.domain.usecase.UpdateCycleDataUseCase
import com.herpace.util.AnalyticsHelper
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import java.time.LocalDate
import java.time.temporal.ChronoUnit
import javax.inject.Inject

@HiltViewModel
class ProfileViewModel @Inject constructor(
    private val profileRepository: ProfileRepository,
    private val authTokenProvider: AuthTokenProvider,
    private val updateCycleDataUseCase: UpdateCycleDataUseCase,
    private val recalculateCyclePhasesUseCase: RecalculateCyclePhasesUseCase,
    private val syncManager: SyncManager,
    private val syncDataUseCase: SyncDataUseCase,
    private val getSyncStatusUseCase: GetSyncStatusUseCase,
    private val analyticsHelper: AnalyticsHelper
) : ViewModel() {

    private val _uiState = MutableStateFlow(ProfileUiState())
    val uiState: StateFlow<ProfileUiState> = _uiState.asStateFlow()

    init {
        loadProfile()
        loadSyncStatus()
    }

    fun loadProfile() {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, errorMessage = null) }
            profileRepository.observeProfile().collect { profile ->
                if (profile != null) {
                    val today = LocalDate.now()
                    val daysSince = ChronoUnit.DAYS.between(profile.lastPeriodStartDate, today).toInt()
                    val dayInCycle = ((daysSince % profile.cycleLength) + profile.cycleLength) % profile.cycleLength
                    val currentPhase = calculateCyclePhase(dayInCycle, profile.cycleLength)

                    _uiState.update {
                        it.copy(
                            profile = profile,
                            currentCyclePhase = currentPhase,
                            dayInCycle = dayInCycle + 1, // 1-indexed for display
                            isLoading = false,
                            errorMessage = null
                        )
                    }
                } else {
                    _uiState.update { it.copy(isLoading = false) }
                }
            }
        }
    }

    private fun calculateCyclePhase(dayInCycle: Int, cycleLength: Int): CyclePhase {
        val menstrualEnd = (cycleLength * 5.0 / 28).toInt()
        val follicularEnd = (cycleLength * 13.0 / 28).toInt()
        val ovulatoryEnd = (cycleLength * 17.0 / 28).toInt()

        return when {
            dayInCycle < menstrualEnd -> CyclePhase.MENSTRUAL
            dayInCycle < follicularEnd -> CyclePhase.FOLLICULAR
            dayInCycle < ovulatoryEnd -> CyclePhase.OVULATORY
            else -> CyclePhase.LUTEAL
        }
    }

    fun showLogPeriodConfirmation() {
        _uiState.update { it.copy(showLogPeriodConfirmation = true) }
    }

    fun dismissLogPeriodConfirmation() {
        _uiState.update { it.copy(showLogPeriodConfirmation = false) }
    }

    fun logPeriodStart() {
        val profile = _uiState.value.profile ?: return
        _uiState.update { it.copy(showLogPeriodConfirmation = false) }

        viewModelScope.launch {
            val today = LocalDate.now()
            when (val result = updateCycleDataUseCase(
                currentProfile = profile,
                cycleLength = profile.cycleLength,
                lastPeriodStartDate = today
            )) {
                is ApiResult.Success -> {
                    analyticsHelper.logPeriodLogged()
                    recalculateCyclePhasesUseCase(profile.cycleLength, today)
                    _uiState.update { it.copy(periodLogSuccess = true) }
                }
                is ApiResult.Error -> {
                    analyticsHelper.logError("period_log", "api_error", result.message)
                    _uiState.update { it.copy(errorMessage = result.message) }
                }
                is ApiResult.NetworkError -> {
                    analyticsHelper.logError("period_log", "network_error", null)
                    _uiState.update { it.copy(errorMessage = "Network error logging period") }
                }
            }
        }
    }

    fun clearPeriodLogSuccess() {
        _uiState.update { it.copy(periodLogSuccess = false) }
    }

    fun clearError() {
        _uiState.update { it.copy(errorMessage = null) }
    }

    fun syncNow() {
        _uiState.update { it.copy(isSyncing = true) }
        analyticsHelper.logSyncTriggered()
        syncDataUseCase()
        // Sync is async via WorkManager, update UI after a brief delay
        viewModelScope.launch {
            kotlinx.coroutines.delay(2000)
            loadSyncStatus()
            _uiState.update { it.copy(isSyncing = false) }
        }
    }

    private fun loadSyncStatus() {
        viewModelScope.launch {
            try {
                val syncStatus = getSyncStatusUseCase()
                _uiState.update {
                    it.copy(
                        lastSyncTimeMillis = syncStatus.lastSyncTimeMillis,
                        pendingSyncCount = syncStatus.pendingCount
                    )
                }
            } catch (_: Exception) {
                // Non-critical
            }
        }
    }

    fun logout() {
        syncManager.cancelAllSync()
        authTokenProvider.clearAuth()
    }
}
