package com.herpace.domain.usecase

import com.herpace.data.remote.ApiResult
import com.herpace.domain.model.VoiceCompletionData
import com.herpace.domain.repository.VoiceCoachRepository
import javax.inject.Inject

class CompleteSessionVoiceUseCase @Inject constructor(
    private val repository: VoiceCoachRepository
) {
    suspend operator fun invoke(
        sessionId: String,
        data: VoiceCompletionData,
        transcript: String?
    ): ApiResult<Unit> {
        return repository.completeSessionVoice(sessionId, data, transcript)
    }
}
