package com.herpace.domain.usecase

import com.herpace.data.remote.ApiResult
import com.herpace.domain.model.Race
import com.herpace.domain.model.RaceDistance
import com.herpace.domain.repository.RaceRepository
import java.time.LocalDate
import javax.inject.Inject

class CreateRaceUseCase @Inject constructor(
    private val raceRepository: RaceRepository
) {
    suspend operator fun invoke(
        name: String,
        date: LocalDate,
        distance: RaceDistance,
        goalTimeMinutes: Int?
    ): ApiResult<Race> {
        val validationError = validate(name, date, distance, goalTimeMinutes)
        if (validationError != null) {
            return ApiResult.Error(-1, validationError)
        }
        return raceRepository.createRace(
            name = name.trim(),
            date = date.toString(),
            distance = distance.toApiValue(),
            goalTimeMinutes = goalTimeMinutes
        )
    }

    private fun validate(
        name: String,
        date: LocalDate,
        distance: RaceDistance,
        goalTimeMinutes: Int?
    ): String? {
        if (name.isBlank()) {
            return "Race name is required"
        }
        if (name.length > 200) {
            return "Race name must be 200 characters or less"
        }
        if (!date.isAfter(LocalDate.now())) {
            return "Race date must be in the future"
        }
        if (distance == RaceDistance.MARATHON && date.isBefore(LocalDate.now().plusWeeks(4))) {
            return "Marathon requires at least 4 weeks of training time"
        }
        if (goalTimeMinutes != null && goalTimeMinutes !in 10..600) {
            return "Goal time must be between 10 and 600 minutes"
        }
        return null
    }
}
