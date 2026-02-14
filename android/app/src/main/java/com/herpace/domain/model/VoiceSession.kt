package com.herpace.domain.model

enum class VoiceSessionState {
    IDLE,
    CONNECTING,
    LISTENING,
    PROCESSING,
    RESPONDING,
    ERROR
}

data class VoiceCompletionData(
    val actualDistance: Double?,
    val actualDuration: Int?,
    val rpe: Int?,
    val notes: String?
)

data class VoiceSessionToken(
    val token: String,
    val webSocketUrl: String,
    val systemInstruction: String?,
    val model: String
)
