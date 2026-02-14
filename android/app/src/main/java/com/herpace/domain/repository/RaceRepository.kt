package com.herpace.domain.repository

import com.herpace.data.remote.ApiResult
import com.herpace.domain.model.Race
import kotlinx.coroutines.flow.Flow

interface RaceRepository {
    suspend fun createRace(name: String, date: String, distance: String, goalTimeMinutes: Int?): ApiResult<Race>
    suspend fun getRaces(): ApiResult<List<Race>>
    fun observeRaces(): Flow<List<Race>>
    suspend fun getRaceById(raceId: String): ApiResult<Race?>
    suspend fun updateRace(raceId: String, name: String, date: String, distance: String, goalTimeMinutes: Int?): ApiResult<Race>
    suspend fun deleteRace(raceId: String): ApiResult<Unit>
}
