package com.herpace.presentation.voicecoach

import android.Manifest
import android.media.AudioManager
import android.util.Log
import androidx.annotation.RequiresPermission
import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.herpace.data.remote.ApiResult
import com.herpace.data.voice.AudioCaptureManager
import com.herpace.data.voice.AudioPlaybackManager
import com.herpace.data.voice.GeminiWebSocketManager
import com.herpace.domain.model.VoiceCompletionData
import com.herpace.domain.model.VoiceSessionState
import com.herpace.domain.usecase.CompleteSessionVoiceUseCase
import com.herpace.domain.usecase.GetVoiceTokenUseCase
import com.herpace.util.AnalyticsHelper
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class VoiceCoachViewModel @Inject constructor(
    private val getVoiceTokenUseCase: GetVoiceTokenUseCase,
    private val completeSessionVoiceUseCase: CompleteSessionVoiceUseCase,
    private val webSocketManager: GeminiWebSocketManager,
    private val analyticsHelper: AnalyticsHelper,
    savedStateHandle: SavedStateHandle
) : ViewModel(), GeminiWebSocketManager.Callback {

    companion object {
        private const val TAG = "VoiceCoachVM"
        private const val SETUP_TIMEOUT_MS = 10_000L
    }

    private val sessionId: String = checkNotNull(savedStateHandle.get<String>("sessionId"))

    private val _uiState = MutableStateFlow(VoiceCoachUiState())
    val uiState: StateFlow<VoiceCoachUiState> = _uiState.asStateFlow()

    private val audioCaptureManager = AudioCaptureManager()
    private val audioPlaybackManager = AudioPlaybackManager()
    private var setupTimeoutJob: Job? = null
    private var pendingToolCallId: String? = null

    /**
     * Starts the voice coach session. Must be called after RECORD_AUDIO permission is granted.
     */
    @RequiresPermission(Manifest.permission.RECORD_AUDIO)
    fun startSession(audioManager: AudioManager) {
        if (_uiState.value.sessionState != VoiceSessionState.IDLE &&
            _uiState.value.sessionState != VoiceSessionState.ERROR
        ) {
            return
        }

        _uiState.update {
            it.copy(
                sessionState = VoiceSessionState.CONNECTING,
                errorMessage = null,
                transcript = "",
                completionData = null,
                showConfirmation = false,
                sessionCompleted = false
            )
        }
        analyticsHelper.logVoiceSessionStarted(sessionId)

        // Initialize audio playback
        if (!audioPlaybackManager.initialize(audioManager)) {
            _uiState.update {
                it.copy(
                    sessionState = VoiceSessionState.ERROR,
                    errorMessage = "Failed to initialize audio playback"
                )
            }
            return
        }
        audioPlaybackManager.requestAudioFocus()

        viewModelScope.launch {
            when (val result = getVoiceTokenUseCase(sessionId)) {
                is ApiResult.Success -> {
                    val token = result.data

                    // Start setup timeout
                    setupTimeoutJob = viewModelScope.launch {
                        delay(SETUP_TIMEOUT_MS)
                        if (_uiState.value.sessionState == VoiceSessionState.CONNECTING) {
                            Log.w(TAG, "Setup timeout — no setupComplete received")
                            _uiState.update {
                                it.copy(
                                    sessionState = VoiceSessionState.ERROR,
                                    errorMessage = "Voice assistant setup timed out. Please try again."
                                )
                            }
                            analyticsHelper.logVoiceSessionError("setup_timeout")
                            stopSession()
                        }
                    }

                    webSocketManager.connect(token, this@VoiceCoachViewModel)
                }
                is ApiResult.Error -> {
                    Log.e(TAG, "Token fetch error: ${result.message}")
                    _uiState.update {
                        it.copy(
                            sessionState = VoiceSessionState.ERROR,
                            errorMessage = "Failed to start voice session: ${result.message}"
                        )
                    }
                    analyticsHelper.logVoiceSessionError("token_error")
                }
                is ApiResult.NetworkError -> {
                    _uiState.update {
                        it.copy(
                            sessionState = VoiceSessionState.ERROR,
                            errorMessage = "Network error. Please check your connection and try again."
                        )
                    }
                    analyticsHelper.logVoiceSessionError("network_error")
                }
            }
        }
    }

    fun stopSession() {
        setupTimeoutJob?.cancel()
        setupTimeoutJob = null
        audioCaptureManager.stop()
        audioPlaybackManager.release()
        webSocketManager.disconnect()

        if (!_uiState.value.sessionCompleted) {
            _uiState.update {
                it.copy(sessionState = VoiceSessionState.IDLE)
            }
        }
    }

    fun confirmCompletion() {
        val data = _uiState.value.completionData ?: return
        val transcript = _uiState.value.transcript

        _uiState.update { it.copy(isCompletingSession = true) }

        viewModelScope.launch {
            when (val result = completeSessionVoiceUseCase(sessionId, data, transcript)) {
                is ApiResult.Success -> {
                    analyticsHelper.logVoiceSessionCompleted(sessionId)
                    _uiState.update {
                        it.copy(
                            isCompletingSession = false,
                            sessionCompleted = true,
                            showConfirmation = false
                        )
                    }
                    stopSession()
                }
                is ApiResult.Error -> {
                    _uiState.update {
                        it.copy(
                            isCompletingSession = false,
                            errorMessage = "Failed to save: ${result.message}"
                        )
                    }
                }
                is ApiResult.NetworkError -> {
                    _uiState.update {
                        it.copy(
                            isCompletingSession = false,
                            errorMessage = "Network error. Please try again."
                        )
                    }
                }
            }
        }
    }

    fun dismissConfirmation() {
        // Send tool response so Gemini can continue the conversation
        pendingToolCallId?.let { callId ->
            webSocketManager.sendToolResponse(callId, "log_workout_completion")
            pendingToolCallId = null
        }
        _uiState.update { it.copy(showConfirmation = false, completionData = null) }
    }

    fun clearError() {
        _uiState.update { it.copy(errorMessage = null) }
    }

    // -- GeminiWebSocketManager.Callback --

    override fun onSetupComplete() {
        setupTimeoutJob?.cancel()
        setupTimeoutJob = null

        _uiState.update { it.copy(sessionState = VoiceSessionState.LISTENING) }

        // Start audio capture
        try {
            @Suppress("MissingPermission")
            val started = audioCaptureManager.start { base64Audio ->
                webSocketManager.sendAudioChunk(base64Audio)
            }
            if (!started) {
                _uiState.update {
                    it.copy(
                        sessionState = VoiceSessionState.ERROR,
                        errorMessage = "Failed to start microphone"
                    )
                }
            }
        } catch (e: SecurityException) {
            _uiState.update {
                it.copy(
                    sessionState = VoiceSessionState.ERROR,
                    errorMessage = "Microphone permission required"
                )
            }
        }
    }

    override fun onAudioResponse(base64Audio: String) {
        _uiState.update { it.copy(sessionState = VoiceSessionState.RESPONDING) }
        audioPlaybackManager.enqueue(base64Audio)
    }

    override fun onTranscript(text: String, isFinal: Boolean) {
        _uiState.update { current ->
            val updated = if (current.transcript.isEmpty()) text else "${current.transcript}\n$text"
            current.copy(transcript = updated)
        }
    }

    override fun onToolCall(name: String, args: Map<String, Any?>, callId: String) {
        if (name == "log_workout_completion") {
            pendingToolCallId = callId

            val completionData = VoiceCompletionData(
                actualDistance = (args["actualDistance"] as? Number)?.toDouble(),
                actualDuration = (args["actualDuration"] as? Number)?.toInt(),
                rpe = (args["rpe"] as? Number)?.toInt(),
                notes = args["notes"] as? String
            )

            _uiState.update {
                it.copy(
                    completionData = completionData,
                    showConfirmation = true
                )
            }

            // Send tool response so Gemini doesn't hang
            webSocketManager.sendToolResponse(callId, name)
        }
    }

    override fun onTurnComplete() {
        // Model finished responding, go back to listening
        if (_uiState.value.sessionState == VoiceSessionState.RESPONDING) {
            _uiState.update { it.copy(sessionState = VoiceSessionState.LISTENING) }
        }
    }

    override fun onInterrupted() {
        audioPlaybackManager.clear()
        _uiState.update { it.copy(sessionState = VoiceSessionState.LISTENING) }
    }

    override fun onError(message: String) {
        _uiState.update {
            it.copy(
                sessionState = VoiceSessionState.ERROR,
                errorMessage = message
            )
        }
        analyticsHelper.logVoiceSessionError("websocket_error")
    }

    override fun onDisconnected(wasClean: Boolean) {
        audioCaptureManager.stop()
        if (!wasClean && _uiState.value.sessionState != VoiceSessionState.ERROR) {
            _uiState.update {
                it.copy(
                    sessionState = VoiceSessionState.ERROR,
                    errorMessage = "Connection lost. Please try again."
                )
            }
        } else if (wasClean && !_uiState.value.sessionCompleted) {
            _uiState.update { it.copy(sessionState = VoiceSessionState.IDLE) }
        }
    }

    override fun onCleared() {
        super.onCleared()
        stopSession()
    }
}
