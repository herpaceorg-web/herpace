package com.herpace.domain.usecase

import com.herpace.data.remote.ApiResult
import com.herpace.domain.model.RunnerProfile
import com.herpace.domain.repository.ProfileRepository
import kotlinx.coroutines.flow.Flow
import javax.inject.Inject

class GetProfileUseCase @Inject constructor(
    private val profileRepository: ProfileRepository
) {
    suspend operator fun invoke(): ApiResult<RunnerProfile?> {
        return profileRepository.getProfile()
    }

    fun observe(): Flow<RunnerProfile?> {
        return profileRepository.observeProfile()
    }
}
