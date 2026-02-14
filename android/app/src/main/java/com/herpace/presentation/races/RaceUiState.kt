package com.herpace.presentation.races

import com.herpace.domain.model.Race
import com.herpace.domain.model.RaceDistance
import java.time.LocalDate

data class RacesListUiState(
    val races: List<Race> = emptyList(),
    val isLoading: Boolean = false,
    val errorMessage: String? = null
)

data class AddEditRaceUiState(
    val name: String = "",
    val date: LocalDate? = null,
    val distance: RaceDistance = RaceDistance.FIVE_K,
    val goalTimeHours: String = "",
    val goalTimeMinutes: String = "",
    val isLoading: Boolean = false,
    val errorMessage: String? = null,
    val isSuccess: Boolean = false,
    val nameError: String? = null,
    val dateError: String? = null,
    val goalTimeError: String? = null,
    val isEditMode: Boolean = false
)
