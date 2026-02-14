package com.herpace.domain.usecase

import com.herpace.data.remote.ApiResult
import com.herpace.domain.model.Race
import com.herpace.domain.repository.RaceRepository
import javax.inject.Inject

class GetRaceByIdUseCase @Inject constructor(
    private val raceRepository: RaceRepository
) {
    suspend operator fun invoke(raceId: String): ApiResult<Race?> {
        return raceRepository.getRaceById(raceId)
    }
}
