package com.herpace.presentation.races

import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.herpace.data.remote.ApiResult
import com.herpace.domain.model.RaceDistance
import com.herpace.domain.usecase.CreateRaceUseCase
import com.herpace.domain.usecase.GetRaceByIdUseCase
import android.util.Log
import com.herpace.domain.usecase.UpdateRaceUseCase
import com.herpace.util.AnalyticsHelper
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import java.time.LocalDate
import javax.inject.Inject

@HiltViewModel
class AddEditRaceViewModel @Inject constructor(
    private val createRaceUseCase: CreateRaceUseCase,
    private val updateRaceUseCase: UpdateRaceUseCase,
    private val getRaceByIdUseCase: GetRaceByIdUseCase,
    private val analyticsHelper: AnalyticsHelper,
    savedStateHandle: SavedStateHandle
) : ViewModel() {

    private val raceId: String? = savedStateHandle.get<String>("raceId")

    private val _uiState = MutableStateFlow(AddEditRaceUiState(isEditMode = raceId != null))
    val uiState: StateFlow<AddEditRaceUiState> = _uiState.asStateFlow()

    init {
        if (raceId != null) {
            loadRace(raceId)
        }
    }

    private fun loadRace(raceId: String) {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true) }

            when (val result = getRaceByIdUseCase(raceId)) {
                is ApiResult.Success -> {
                    val race = result.data
                    if (race != null) {
                        val hours = (race.goalTimeMinutes ?: 0) / 60
                        val minutes = (race.goalTimeMinutes ?: 0) % 60
                        _uiState.update {
                            it.copy(
                                name = race.name,
                                date = race.date,
                                distance = race.distance,
                                goalTimeHours = if (hours > 0) hours.toString() else "",
                                goalTimeMinutes = if (race.goalTimeMinutes != null) minutes.toString() else "",
                                isLoading = false
                            )
                        }
                    } else {
                        _uiState.update {
                            it.copy(isLoading = false, errorMessage = "Race not found")
                        }
                    }
                }
                is ApiResult.Error -> {
                    _uiState.update {
                        it.copy(isLoading = false, errorMessage = result.message ?: "Failed to load race")
                    }
                }
                is ApiResult.NetworkError -> {
                    _uiState.update {
                        it.copy(isLoading = false, errorMessage = "Network error. Please try again.")
                    }
                }
            }
        }
    }

    fun onNameChange(name: String) {
        _uiState.update { it.copy(name = name, nameError = null, errorMessage = null) }
    }

    fun onDateChange(date: LocalDate) {
        _uiState.update { it.copy(date = date, dateError = null, errorMessage = null) }
    }

    fun onDistanceChange(distance: RaceDistance) {
        _uiState.update { it.copy(distance = distance, errorMessage = null) }
    }

    fun onGoalTimeHoursChange(hours: String) {
        if (hours.isEmpty() || hours.toIntOrNull() != null) {
            _uiState.update { it.copy(goalTimeHours = hours, goalTimeError = null, errorMessage = null) }
        }
    }

    fun onGoalTimeMinutesChange(minutes: String) {
        if (minutes.isEmpty() || minutes.toIntOrNull() != null) {
            _uiState.update { it.copy(goalTimeMinutes = minutes, goalTimeError = null, errorMessage = null) }
        }
    }

    fun saveRace() {
        val state = _uiState.value
        if (!validateFields(state)) return

        val totalMinutes = calculateGoalTimeMinutes(state)

        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, errorMessage = null) }

            val result = if (raceId != null) {
                updateRaceUseCase(
                    raceId = raceId,
                    name = state.name.trim(),
                    date = state.date!!,
                    distance = state.distance,
                    goalTimeMinutes = totalMinutes
                )
            } else {
                createRaceUseCase(
                    name = state.name.trim(),
                    date = state.date!!,
                    distance = state.distance,
                    goalTimeMinutes = totalMinutes
                )
            }

            when (result) {
                is ApiResult.Success -> {
                    if (raceId == null) {
                        analyticsHelper.logRaceCreated(state.distance.name)
                    }
                    _uiState.update { it.copy(isLoading = false, isSuccess = true) }
                }
                is ApiResult.Error -> {
                    val action = if (raceId != null) "race_update" else "race_create"
                    Log.w("AddEditRaceViewModel", "Failed to save race: ${result.message}")
                    analyticsHelper.logError(action, "api_error", result.message)
                    _uiState.update {
                        it.copy(isLoading = false, errorMessage = result.message ?: "Failed to save race")
                    }
                }
                is ApiResult.NetworkError -> {
                    val action = if (raceId != null) "race_update" else "race_create"
                    analyticsHelper.logError(action, "network_error", null)
                    _uiState.update {
                        it.copy(isLoading = false, errorMessage = "Network error. Please try again.")
                    }
                }
            }
        }
    }

    fun resetSuccess() {
        _uiState.update { it.copy(isSuccess = false) }
    }

    private fun validateFields(state: AddEditRaceUiState): Boolean {
        var valid = true

        if (state.name.isBlank()) {
            _uiState.update { it.copy(nameError = "Race name is required") }
            valid = false
        } else if (state.name.length > 200) {
            _uiState.update { it.copy(nameError = "Race name must be 200 characters or less") }
            valid = false
        }

        if (state.date == null) {
            _uiState.update { it.copy(dateError = "Race date is required") }
            valid = false
        } else if (!state.date.isAfter(LocalDate.now())) {
            _uiState.update { it.copy(dateError = "Race date must be in the future") }
            valid = false
        }

        val totalMinutes = calculateGoalTimeMinutes(state)
        if (totalMinutes != null && totalMinutes !in 10..600) {
            _uiState.update { it.copy(goalTimeError = "Goal time must be between 10 and 600 minutes") }
            valid = false
        }

        return valid
    }

    private fun calculateGoalTimeMinutes(state: AddEditRaceUiState): Int? {
        val hours = state.goalTimeHours.toIntOrNull() ?: 0
        val minutes = state.goalTimeMinutes.toIntOrNull() ?: 0
        return if (hours == 0 && minutes == 0) null else (hours * 60) + minutes
    }
}
