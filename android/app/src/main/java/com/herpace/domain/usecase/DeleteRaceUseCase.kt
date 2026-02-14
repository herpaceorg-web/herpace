package com.herpace.domain.usecase

import com.herpace.data.remote.ApiResult
import com.herpace.domain.repository.RaceRepository
import javax.inject.Inject

class DeleteRaceUseCase @Inject constructor(
    private val raceRepository: RaceRepository
) {
    suspend operator fun invoke(raceId: String): ApiResult<Unit> {
        return raceRepository.deleteRace(raceId)
    }
}
