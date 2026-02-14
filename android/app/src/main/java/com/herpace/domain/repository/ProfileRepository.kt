package com.herpace.domain.repository

import com.herpace.data.remote.ApiResult
import com.herpace.domain.model.RunnerProfile
import kotlinx.coroutines.flow.Flow

interface ProfileRepository {
    suspend fun saveProfile(profile: RunnerProfile): ApiResult<RunnerProfile>
    suspend fun getProfile(): ApiResult<RunnerProfile?>
    fun observeProfile(): Flow<RunnerProfile?>
}
