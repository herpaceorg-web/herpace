package com.herpace.data.repository

import com.herpace.data.remote.ApiResult
import com.herpace.data.remote.HerPaceApiService
import com.herpace.data.remote.dto.VoiceCompletionRequest
import com.herpace.data.remote.dto.VoiceSessionTokenRequest
import com.herpace.data.remote.safeApiCall
import com.herpace.domain.model.VoiceCompletionData
import com.herpace.domain.model.VoiceSessionToken
import com.herpace.domain.repository.VoiceCoachRepository
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class VoiceCoachRepositoryImpl @Inject constructor(
    private val apiService: HerPaceApiService
) : VoiceCoachRepository {

    override suspend fun getSessionToken(sessionId: String?): ApiResult<VoiceSessionToken> {
        val result = safeApiCall {
            apiService.getVoiceToken(VoiceSessionTokenRequest(sessionId = sessionId))
        }
        return when (result) {
            is ApiResult.Success -> ApiResult.Success(result.data.toDomain())
            is ApiResult.Error -> result
            is ApiResult.NetworkError -> result
        }
    }

    override suspend fun completeSessionVoice(
        sessionId: String,
        data: VoiceCompletionData,
        transcript: String?
    ): ApiResult<Unit> {
        return safeApiCall {
            apiService.completeSessionVoice(
                sessionId = sessionId,
                request = VoiceCompletionRequest.fromDomain(data, transcript)
            )
        }
    }
}
