package com.herpace.presentation.profile

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.herpace.data.remote.ApiResult
import com.herpace.domain.repository.ProfileRepository
import com.herpace.domain.usecase.RecalculateCyclePhasesUseCase
import android.util.Log
import com.herpace.domain.usecase.UpdateCycleDataUseCase
import com.herpace.util.AnalyticsHelper
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import java.time.LocalDate
import java.time.format.DateTimeFormatter
import javax.inject.Inject

data class CycleTrackingUiState(
    val cycleLengthText: String = "28",
    val lastPeriodStartDate: LocalDate = LocalDate.now(),
    val isLoading: Boolean = false,
    val isSaving: Boolean = false,
    val errorMessage: String? = null,
    val saveSuccess: Boolean = false
)

@HiltViewModel
class CycleTrackingViewModel @Inject constructor(
    private val profileRepository: ProfileRepository,
    private val updateCycleDataUseCase: UpdateCycleDataUseCase,
    private val recalculateCyclePhasesUseCase: RecalculateCyclePhasesUseCase,
    private val analyticsHelper: AnalyticsHelper
) : ViewModel() {

    private val _uiState = MutableStateFlow(CycleTrackingUiState())
    val uiState: StateFlow<CycleTrackingUiState> = _uiState.asStateFlow()

    init {
        loadCurrentCycleData()
    }

    private fun loadCurrentCycleData() {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true) }
            when (val result = profileRepository.getProfile()) {
                is ApiResult.Success -> {
                    val profile = result.data
                    if (profile != null) {
                        _uiState.update {
                            it.copy(
                                cycleLengthText = profile.cycleLength.toString(),
                                lastPeriodStartDate = profile.lastPeriodStartDate,
                                isLoading = false
                            )
                        }
                    } else {
                        _uiState.update { it.copy(isLoading = false) }
                    }
                }
                is ApiResult.Error -> {
                    _uiState.update {
                        it.copy(isLoading = false, errorMessage = result.message)
                    }
                }
                is ApiResult.NetworkError -> {
                    _uiState.update {
                        it.copy(isLoading = false, errorMessage = "Network error loading profile")
                    }
                }
            }
        }
    }

    fun onCycleLengthChange(text: String) {
        // Only allow digits
        if (text.isEmpty() || text.all { it.isDigit() }) {
            _uiState.update { it.copy(cycleLengthText = text, errorMessage = null) }
        }
    }

    fun onLastPeriodDateChange(date: LocalDate) {
        _uiState.update { it.copy(lastPeriodStartDate = date, errorMessage = null) }
    }

    fun saveCycleData() {
        val state = _uiState.value
        val cycleLength = state.cycleLengthText.toIntOrNull()
        if (cycleLength == null) {
            _uiState.update { it.copy(errorMessage = "Please enter a valid cycle length") }
            return
        }

        viewModelScope.launch {
            _uiState.update { it.copy(isSaving = true, errorMessage = null) }

            when (val profileResult = profileRepository.getProfile()) {
                is ApiResult.Success -> {
                    val currentProfile = profileResult.data
                    if (currentProfile == null) {
                        _uiState.update {
                            it.copy(isSaving = false, errorMessage = "Profile not found")
                        }
                        return@launch
                    }

                    when (val result = updateCycleDataUseCase(
                        currentProfile = currentProfile,
                        cycleLength = cycleLength,
                        lastPeriodStartDate = state.lastPeriodStartDate
                    )) {
                        is ApiResult.Success -> {
                            analyticsHelper.logCycleDataUpdated()
                            recalculateCyclePhasesUseCase(cycleLength, state.lastPeriodStartDate)
                            _uiState.update { it.copy(isSaving = false, saveSuccess = true) }
                        }
                        is ApiResult.Error -> {
                            Log.w("CycleTrackingVM", "Failed to save cycle data: ${result.message}")
                            analyticsHelper.logError("cycle_update", "api_error", result.message)
                            _uiState.update {
                                it.copy(isSaving = false, errorMessage = result.message)
                            }
                        }
                        is ApiResult.NetworkError -> {
                            analyticsHelper.logError("cycle_update", "network_error", null)
                            _uiState.update {
                                it.copy(isSaving = false, errorMessage = "Network error saving cycle data")
                            }
                        }
                    }
                }
                is ApiResult.Error -> {
                    _uiState.update {
                        it.copy(isSaving = false, errorMessage = profileResult.message)
                    }
                }
                is ApiResult.NetworkError -> {
                    _uiState.update {
                        it.copy(isSaving = false, errorMessage = "Network error")
                    }
                }
            }
        }
    }

    fun clearError() {
        _uiState.update { it.copy(errorMessage = null) }
    }

    fun clearSaveSuccess() {
        _uiState.update { it.copy(saveSuccess = false) }
    }
}
