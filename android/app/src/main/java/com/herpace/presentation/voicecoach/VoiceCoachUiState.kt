package com.herpace.presentation.voicecoach

import com.herpace.domain.model.VoiceCompletionData
import com.herpace.domain.model.VoiceSessionState

data class VoiceCoachUiState(
    val sessionState: VoiceSessionState = VoiceSessionState.IDLE,
    val transcript: String = "",
    val completionData: VoiceCompletionData? = null,
    val showConfirmation: Boolean = false,
    val isCompletingSession: Boolean = false,
    val errorMessage: String? = null,
    val sessionCompleted: Boolean = false
)
