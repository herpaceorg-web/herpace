package com.herpace.presentation.session

import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.herpace.data.remote.ApiResult
import com.herpace.data.repository.AuthTokenProvider
import com.herpace.domain.repository.TrainingPlanRepository
import com.herpace.domain.repository.WorkoutLogRepository
import com.herpace.domain.usecase.LogWorkoutDetailsUseCase
import com.herpace.domain.usecase.MarkSessionCompleteUseCase
import com.herpace.domain.usecase.UndoSessionCompletionUseCase
import com.herpace.util.AnalyticsHelper
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class SessionDetailViewModel @Inject constructor(
    private val trainingPlanRepository: TrainingPlanRepository,
    private val workoutLogRepository: WorkoutLogRepository,
    private val markSessionCompleteUseCase: MarkSessionCompleteUseCase,
    private val logWorkoutDetailsUseCase: LogWorkoutDetailsUseCase,
    private val undoSessionCompletionUseCase: UndoSessionCompletionUseCase,
    private val authTokenProvider: AuthTokenProvider,
    private val analyticsHelper: AnalyticsHelper,
    savedStateHandle: SavedStateHandle
) : ViewModel() {

    private val sessionId: String = checkNotNull(savedStateHandle.get<String>("sessionId"))

    private val _uiState = MutableStateFlow(SessionDetailUiState())
    val uiState: StateFlow<SessionDetailUiState> = _uiState.asStateFlow()

    init {
        loadSession()
    }

    fun loadSession() {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, errorMessage = null) }
            val session = trainingPlanRepository.getSessionById(sessionId)
            if (session != null) {
                val log = workoutLogRepository.getBySessionId(sessionId)
                _uiState.update { it.copy(session = session, workoutLog = log, isLoading = false) }
            } else {
                _uiState.update {
                    it.copy(isLoading = false, errorMessage = "Session not found")
                }
            }
        }
    }

    fun markCompleted() {
        viewModelScope.launch {
            _uiState.update { it.copy(isMarkingComplete = true) }
            when (val result = markSessionCompleteUseCase(sessionId)) {
                is ApiResult.Success -> {
                    val workoutType = _uiState.value.session?.workoutType?.displayName ?: "unknown"
                    analyticsHelper.logSessionCompleted(workoutType)
                    _uiState.update { it.copy(isMarkingComplete = false, showLogWorkoutDialog = true) }
                    loadSession()
                }
                is ApiResult.Error -> {
                    analyticsHelper.logError("session_complete", "api_error", result.message)
                    _uiState.update {
                        it.copy(
                            isMarkingComplete = false,
                            errorMessage = "Failed to mark session as completed"
                        )
                    }
                }
                is ApiResult.NetworkError -> {
                    analyticsHelper.logError("session_complete", "network_error", null)
                    _uiState.update {
                        it.copy(
                            isMarkingComplete = false,
                            errorMessage = "Network error. Please try again."
                        )
                    }
                }
            }
        }
    }

    fun logWorkoutDetails(
        actualDistanceKm: Double,
        actualDurationMinutes: Int,
        perceivedEffort: Int,
        notes: String?
    ) {
        val userId = authTokenProvider.getUserId() ?: return
        viewModelScope.launch {
            _uiState.update { it.copy(isLoggingWorkout = true) }
            val result = logWorkoutDetailsUseCase(
                sessionId = sessionId,
                userId = userId,
                actualDistanceKm = actualDistanceKm,
                actualDurationMinutes = actualDurationMinutes,
                perceivedEffort = perceivedEffort,
                notes = notes
            )
            result.fold(
                onSuccess = { log ->
                    analyticsHelper.logWorkoutLogged()
                    _uiState.update {
                        it.copy(
                            workoutLog = log,
                            isLoggingWorkout = false,
                            showLogWorkoutDialog = false
                        )
                    }
                },
                onFailure = { error ->
                    analyticsHelper.logError("workout_log", "exception", error.message)
                    _uiState.update {
                        it.copy(
                            isLoggingWorkout = false,
                            errorMessage = error.message ?: "Failed to log workout details"
                        )
                    }
                }
            )
        }
    }

    fun undoCompletion() {
        viewModelScope.launch {
            _uiState.update { it.copy(isMarkingComplete = true) }
            when (undoSessionCompletionUseCase(sessionId)) {
                is ApiResult.Success -> {
                    _uiState.update { it.copy(isMarkingComplete = false, workoutLog = null) }
                    loadSession()
                }
                is ApiResult.Error -> {
                    _uiState.update {
                        it.copy(
                            isMarkingComplete = false,
                            errorMessage = "Failed to undo completion"
                        )
                    }
                }
                is ApiResult.NetworkError -> {
                    _uiState.update {
                        it.copy(
                            isMarkingComplete = false,
                            errorMessage = "Network error. Please try again."
                        )
                    }
                }
            }
        }
    }

    fun showLogWorkoutDialog() {
        _uiState.update { it.copy(showLogWorkoutDialog = true) }
    }

    fun dismissLogWorkoutDialog() {
        _uiState.update { it.copy(showLogWorkoutDialog = false) }
    }

    fun clearError() {
        _uiState.update { it.copy(errorMessage = null) }
    }
}
