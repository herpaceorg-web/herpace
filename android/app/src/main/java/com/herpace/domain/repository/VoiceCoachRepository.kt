package com.herpace.domain.repository

import com.herpace.data.remote.ApiResult
import com.herpace.domain.model.VoiceCompletionData
import com.herpace.domain.model.VoiceSessionToken

interface VoiceCoachRepository {
    suspend fun getSessionToken(sessionId: String?): ApiResult<VoiceSessionToken>
    suspend fun completeSessionVoice(
        sessionId: String,
        data: VoiceCompletionData,
        transcript: String?
    ): ApiResult<Unit>
}
