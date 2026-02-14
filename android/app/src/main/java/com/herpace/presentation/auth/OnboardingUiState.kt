package com.herpace.presentation.auth

import com.herpace.domain.model.FitnessLevel
import java.time.LocalDate

data class OnboardingUiState(
    val name: String = "",
    val age: String = "",
    val fitnessLevel: FitnessLevel = FitnessLevel.BEGINNER,
    val currentWeeklyMileage: String = "",
    val cycleLength: String = "28",
    val lastPeriodStartDate: LocalDate? = null,
    val notificationsEnabled: Boolean = true,
    val isLoading: Boolean = false,
    val errorMessage: String? = null,
    val isSuccess: Boolean = false,
    val nameError: String? = null,
    val ageError: String? = null,
    val mileageError: String? = null,
    val cycleLengthError: String? = null,
    val dateError: String? = null
)
