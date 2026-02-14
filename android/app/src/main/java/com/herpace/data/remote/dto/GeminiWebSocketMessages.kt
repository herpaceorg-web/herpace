package com.herpace.data.remote.dto

import kotlinx.serialization.Serializable
import kotlinx.serialization.json.JsonObject

/**
 * Outbound messages sent to the Gemini Live API WebSocket.
 * These are serialized to JSON via kotlinx.serialization.
 */

@Serializable
data class GeminiSetupMessage(
    val setup: GeminiSetup
)

@Serializable
data class GeminiSetup(
    val model: String,
    val generationConfig: GeminiGenerationConfig? = null,
    val tools: List<GeminiTool>? = null,
    val systemInstruction: GeminiSystemInstruction? = null,
    val inputAudioTranscription: JsonObject? = null,
    val outputAudioTranscription: JsonObject? = null
)

@Serializable
data class GeminiGenerationConfig(
    val responseModalities: List<String>? = null,
    val thinkingConfig: GeminiThinkingConfig? = null,
    val speechConfig: GeminiSpeechConfig? = null
)

@Serializable
data class GeminiThinkingConfig(
    val thinkingBudget: Int = 0
)

@Serializable
data class GeminiSpeechConfig(
    val voiceConfig: GeminiVoiceConfig? = null
)

@Serializable
data class GeminiVoiceConfig(
    val prebuiltVoiceConfig: GeminiPrebuiltVoiceConfig? = null
)

@Serializable
data class GeminiPrebuiltVoiceConfig(
    val voiceName: String = "Aoede"
)

@Serializable
data class GeminiTool(
    val functionDeclarations: List<GeminiFunctionDeclaration>
)

@Serializable
data class GeminiFunctionDeclaration(
    val name: String,
    val description: String,
    val parameters: JsonObject
)

@Serializable
data class GeminiSystemInstruction(
    val parts: List<GeminiTextPart>
)

@Serializable
data class GeminiTextPart(
    val text: String
)

@Serializable
data class GeminiRealtimeInputMessage(
    val realtimeInput: GeminiRealtimeInput
)

@Serializable
data class GeminiRealtimeInput(
    val mediaChunks: List<GeminiMediaChunk>
)

@Serializable
data class GeminiMediaChunk(
    val mimeType: String = "audio/pcm;rate=16000",
    val data: String // base64 encoded audio
)

@Serializable
data class GeminiToolResponseMessage(
    val toolResponse: GeminiToolResponse
)

@Serializable
data class GeminiToolResponse(
    val functionResponses: List<GeminiFunctionResponse>
)

@Serializable
data class GeminiFunctionResponse(
    val id: String,
    val name: String,
    val response: GeminiFunctionResult
)

@Serializable
data class GeminiFunctionResult(
    val result: String
)
