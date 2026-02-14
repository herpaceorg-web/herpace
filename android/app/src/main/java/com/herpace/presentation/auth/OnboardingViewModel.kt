package com.herpace.presentation.auth

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.herpace.data.remote.ApiResult
import com.herpace.domain.model.FitnessLevel
import com.herpace.domain.model.RunnerProfile
import com.herpace.domain.repository.AuthRepository
import com.herpace.domain.usecase.SaveProfileUseCase
import com.herpace.util.AnalyticsHelper
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import java.time.Instant
import java.time.LocalDate
import javax.inject.Inject

@HiltViewModel
class OnboardingViewModel @Inject constructor(
    private val saveProfileUseCase: SaveProfileUseCase,
    private val authRepository: AuthRepository,
    private val analyticsHelper: AnalyticsHelper
) : ViewModel() {

    private val _uiState = MutableStateFlow(OnboardingUiState())
    val uiState: StateFlow<OnboardingUiState> = _uiState.asStateFlow()

    fun onNameChange(name: String) {
        _uiState.update { it.copy(name = name, nameError = null, errorMessage = null) }
    }

    fun onAgeChange(age: String) {
        _uiState.update { it.copy(age = age, ageError = null, errorMessage = null) }
    }

    fun onFitnessLevelChange(level: FitnessLevel) {
        _uiState.update { it.copy(fitnessLevel = level) }
    }

    fun onWeeklyMileageChange(mileage: String) {
        _uiState.update { it.copy(currentWeeklyMileage = mileage, mileageError = null, errorMessage = null) }
    }

    fun onCycleLengthChange(length: String) {
        _uiState.update { it.copy(cycleLength = length, cycleLengthError = null, errorMessage = null) }
    }

    fun onLastPeriodDateChange(date: LocalDate) {
        _uiState.update { it.copy(lastPeriodStartDate = date, dateError = null, errorMessage = null) }
    }

    fun onNotificationsToggle(enabled: Boolean) {
        _uiState.update { it.copy(notificationsEnabled = enabled) }
    }

    fun saveProfile() {
        val state = _uiState.value
        if (!validateFields(state)) return

        val userId = authRepository.getCurrentUserId()
        if (userId == null) {
            _uiState.update {
                it.copy(errorMessage = "Session expired. Please log in again.")
            }
            return
        }

        val profile = RunnerProfile(
            userId = userId,
            name = state.name.trim(),
            age = state.age.toInt(),
            fitnessLevel = state.fitnessLevel,
            currentWeeklyMileage = state.currentWeeklyMileage.toDoubleOrNull() ?: 0.0,
            cycleLength = state.cycleLength.toInt(),
            lastPeriodStartDate = state.lastPeriodStartDate!!,
            notificationsEnabled = state.notificationsEnabled,
            lastUpdated = Instant.now()
        )

        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, errorMessage = null) }

            try {
                when (val result = saveProfileUseCase(profile)) {
                    is ApiResult.Success -> {
                        analyticsHelper.logOnboardingComplete()
                        _uiState.update { it.copy(isLoading = false, isSuccess = true) }
                    }
                    is ApiResult.Error -> {
                        analyticsHelper.logError("onboarding", "api_error", result.message)
                        _uiState.update {
                            it.copy(
                                isLoading = false,
                                errorMessage = result.message ?: "Failed to save profile"
                            )
                        }
                    }
                    is ApiResult.NetworkError -> {
                        analyticsHelper.logError("onboarding", "network_error", null)
                        _uiState.update {
                            it.copy(
                                isLoading = false,
                                errorMessage = "Network error. Please check your connection."
                            )
                        }
                    }
                }
            } catch (e: Exception) {
                analyticsHelper.logError("onboarding", "exception", e.message)
                _uiState.update {
                    it.copy(
                        isLoading = false,
                        errorMessage = e.message ?: "An unexpected error occurred"
                    )
                }
            }
        }
    }

    fun clearError() {
        _uiState.update { it.copy(errorMessage = null) }
    }

    fun resetSuccess() {
        _uiState.update { it.copy(isSuccess = false) }
    }

    private fun validateFields(state: OnboardingUiState): Boolean {
        var valid = true

        if (state.name.isBlank()) {
            _uiState.update { it.copy(nameError = "Name is required") }
            valid = false
        } else if (state.name.length > 100) {
            _uiState.update { it.copy(nameError = "Name must be 100 characters or less") }
            valid = false
        }

        val age = state.age.toIntOrNull()
        if (age == null || age !in 13..120) {
            _uiState.update { it.copy(ageError = "Age must be between 13 and 120") }
            valid = false
        }

        val mileage = state.currentWeeklyMileage.toDoubleOrNull()
        if (mileage != null && mileage !in 0.0..250.0) {
            _uiState.update { it.copy(mileageError = "Mileage must be between 0 and 250 km") }
            valid = false
        }

        val cycleLen = state.cycleLength.toIntOrNull()
        if (cycleLen == null || cycleLen !in 21..40) {
            _uiState.update { it.copy(cycleLengthError = "Cycle length must be between 21 and 40 days") }
            valid = false
        }

        if (state.lastPeriodStartDate == null) {
            _uiState.update { it.copy(dateError = "Please select your last period start date") }
            valid = false
        } else if (state.lastPeriodStartDate.isAfter(LocalDate.now())) {
            _uiState.update { it.copy(dateError = "Date cannot be in the future") }
            valid = false
        } else if (state.lastPeriodStartDate.isBefore(LocalDate.now().minusDays(90))) {
            _uiState.update { it.copy(dateError = "Date cannot be more than 90 days ago") }
            valid = false
        }

        return valid
    }
}
