package com.herpace.presentation.races

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.herpace.data.remote.ApiResult
import com.herpace.domain.usecase.DeleteRaceUseCase
import android.util.Log
import com.herpace.domain.usecase.GetRacesUseCase
import com.herpace.util.AnalyticsHelper
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class RacesViewModel @Inject constructor(
    private val getRacesUseCase: GetRacesUseCase,
    private val deleteRaceUseCase: DeleteRaceUseCase,
    private val analyticsHelper: AnalyticsHelper
) : ViewModel() {

    private val _uiState = MutableStateFlow(RacesListUiState())
    val uiState: StateFlow<RacesListUiState> = _uiState.asStateFlow()

    init {
        observeRaces()
        refreshRaces()
    }

    private fun observeRaces() {
        viewModelScope.launch {
            getRacesUseCase.observe().collect { races ->
                _uiState.update { it.copy(races = races) }
            }
        }
    }

    fun refreshRaces() {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, errorMessage = null) }

            when (val result = getRacesUseCase()) {
                is ApiResult.Success -> {
                    _uiState.update { it.copy(isLoading = false) }
                }
                is ApiResult.Error -> {
                    Log.w("RacesViewModel", "Failed to load races: ${result.message}")
                    analyticsHelper.logError("races_load", "api_error", result.message)
                    _uiState.update {
                        it.copy(
                            isLoading = false,
                            errorMessage = result.message ?: "Failed to load races"
                        )
                    }
                }
                is ApiResult.NetworkError -> {
                    Log.w("RacesViewModel", "Network error loading races")
                    _uiState.update {
                        it.copy(
                            isLoading = false,
                            errorMessage = "Network error. Showing cached data."
                        )
                    }
                }
            }
        }
    }

    fun deleteRace(raceId: String) {
        viewModelScope.launch {
            when (val result = deleteRaceUseCase(raceId)) {
                is ApiResult.Success -> {
                    refreshRaces()
                }
                is ApiResult.Error -> {
                    Log.w("RacesViewModel", "Failed to delete race: ${result.message}")
                    analyticsHelper.logError("race_delete", "api_error", result.message)
                    _uiState.update {
                        it.copy(errorMessage = result.message ?: "Failed to delete race")
                    }
                }
                is ApiResult.NetworkError -> {
                    analyticsHelper.logError("race_delete", "network_error", null)
                    _uiState.update {
                        it.copy(errorMessage = "Network error. Please try again.")
                    }
                }
            }
        }
    }

    fun clearError() {
        _uiState.update { it.copy(errorMessage = null) }
    }
}
