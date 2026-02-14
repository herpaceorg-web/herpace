package com.herpace.domain.usecase

import com.herpace.data.remote.ApiResult
import com.herpace.domain.model.VoiceSessionToken
import com.herpace.domain.repository.VoiceCoachRepository
import javax.inject.Inject

class GetVoiceTokenUseCase @Inject constructor(
    private val repository: VoiceCoachRepository
) {
    suspend operator fun invoke(sessionId: String?): ApiResult<VoiceSessionToken> {
        return repository.getSessionToken(sessionId)
    }
}
