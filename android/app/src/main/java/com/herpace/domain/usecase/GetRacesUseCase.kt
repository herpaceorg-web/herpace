package com.herpace.domain.usecase

import com.herpace.data.remote.ApiResult
import com.herpace.domain.model.Race
import com.herpace.domain.repository.RaceRepository
import kotlinx.coroutines.flow.Flow
import javax.inject.Inject

class GetRacesUseCase @Inject constructor(
    private val raceRepository: RaceRepository
) {
    suspend operator fun invoke(): ApiResult<List<Race>> {
        return raceRepository.getRaces()
    }

    fun observe(): Flow<List<Race>> {
        return raceRepository.observeRaces()
    }
}
