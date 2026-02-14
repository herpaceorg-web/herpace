package com.herpace.presentation.plan

import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.herpace.data.remote.ApiResult
import com.herpace.domain.usecase.GenerateTrainingPlanUseCase
import com.herpace.domain.usecase.GetActiveTrainingPlanUseCase
import com.herpace.domain.usecase.GetSessionsByWeekUseCase
import com.herpace.util.AnalyticsHelper
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class TrainingPlanViewModel @Inject constructor(
    private val generateTrainingPlanUseCase: GenerateTrainingPlanUseCase,
    private val getActiveTrainingPlanUseCase: GetActiveTrainingPlanUseCase,
    private val getSessionsByWeekUseCase: GetSessionsByWeekUseCase,
    private val analyticsHelper: AnalyticsHelper,
    savedStateHandle: SavedStateHandle
) : ViewModel() {

    private val raceId: String? = savedStateHandle.get<String>("raceId")

    private val _uiState = MutableStateFlow(TrainingPlanUiState())
    val uiState: StateFlow<TrainingPlanUiState> = _uiState.asStateFlow()

    init {
        loadActivePlan()
    }

    private fun loadActivePlan() {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, errorMessage = null) }

            when (val result = getActiveTrainingPlanUseCase()) {
                is ApiResult.Success -> {
                    val plan = result.data
                    if (plan != null) {
                        val sessionsByWeek = plan.sessions.groupBy { it.weekNumber }
                        _uiState.update {
                            it.copy(
                                plan = plan,
                                sessionsByWeek = sessionsByWeek,
                                selectedWeek = 1,
                                isLoading = false
                            )
                        }
                    } else {
                        _uiState.update { it.copy(isLoading = false) }
                    }
                }
                is ApiResult.Error -> {
                    _uiState.update {
                        it.copy(
                            isLoading = false,
                            errorMessage = result.message ?: "Failed to load training plan"
                        )
                    }
                }
                is ApiResult.NetworkError -> {
                    _uiState.update {
                        it.copy(
                            isLoading = false,
                            errorMessage = "Network error. Showing cached plan."
                        )
                    }
                }
            }
        }
    }

    fun generatePlan(raceId: String) {
        viewModelScope.launch {
            _uiState.update { it.copy(isGenerating = true, errorMessage = null) }

            when (val result = generateTrainingPlanUseCase(raceId)) {
                is ApiResult.Success -> {
                    val plan = result.data
                    analyticsHelper.logPlanGenerated(raceId, plan.totalWeeks)
                    val sessionsByWeek = plan.sessions.groupBy { it.weekNumber }
                    _uiState.update {
                        it.copy(
                            plan = plan,
                            sessionsByWeek = sessionsByWeek,
                            selectedWeek = 1,
                            isGenerating = false,
                            generationSuccess = true
                        )
                    }
                }
                is ApiResult.Error -> {
                    analyticsHelper.logError("plan_generation", "api_error", result.message)
                    _uiState.update {
                        it.copy(
                            isGenerating = false,
                            errorMessage = result.message ?: "Failed to generate plan"
                        )
                    }
                }
                is ApiResult.NetworkError -> {
                    analyticsHelper.logError("plan_generation", "network_error", null)
                    _uiState.update {
                        it.copy(
                            isGenerating = false,
                            errorMessage = "Network error. Please check your connection and try again."
                        )
                    }
                }
            }
        }
    }

    fun selectWeek(weekNumber: Int) {
        _uiState.update { it.copy(selectedWeek = weekNumber) }
    }

    fun retry() {
        val currentRaceId = raceId ?: _uiState.value.plan?.raceId
        if (currentRaceId != null) {
            generatePlan(currentRaceId)
        } else {
            loadActivePlan()
        }
    }

    fun clearError() {
        _uiState.update { it.copy(errorMessage = null) }
    }

    fun resetGenerationSuccess() {
        _uiState.update { it.copy(generationSuccess = false) }
    }
}
