package com.herpace.data.remote.dto

import com.herpace.domain.model.VoiceCompletionData
import com.herpace.domain.model.VoiceSessionToken
import kotlinx.serialization.Serializable

@Serializable
data class VoiceSessionTokenRequest(
    val sessionId: String? = null
)

@Serializable
data class VoiceSessionTokenResponse(
    val token: String,
    val webSocketUrl: String,
    val expiresAt: String,
    val sessionContext: VoiceSessionContextResponse? = null,
    val systemInstruction: String? = null,
    val model: String? = null
) {
    fun toDomain(): VoiceSessionToken = VoiceSessionToken(
        token = token,
        webSocketUrl = webSocketUrl,
        systemInstruction = systemInstruction,
        model = model ?: "models/gemini-2.5-flash-native-audio-preview-12-2025"
    )
}

@Serializable
data class VoiceSessionContextResponse(
    val sessionId: String,
    val sessionName: String,
    val workoutType: String,
    val plannedDistance: Double? = null,
    val plannedDuration: Int? = null,
    val cyclePhase: String? = null,
    val phaseGuidance: String? = null,
    val workoutTips: List<String> = emptyList(),
    val intensityLevel: String,
    val hrZones: String? = null
)

@Serializable
data class VoiceCompletionRequest(
    val actualDistance: Double? = null,
    val actualDuration: Int? = null,
    val rpe: Int? = null,
    val userNotes: String? = null,
    val voiceTranscript: String? = null
) {
    companion object {
        fun fromDomain(data: VoiceCompletionData, transcript: String?): VoiceCompletionRequest =
            VoiceCompletionRequest(
                actualDistance = data.actualDistance,
                actualDuration = data.actualDuration,
                rpe = data.rpe,
                userNotes = data.notes,
                voiceTranscript = transcript
            )
    }
}
