package com.herpace.data.voice

import android.util.Log
import com.herpace.data.remote.dto.GeminiFunctionDeclaration
import com.herpace.data.remote.dto.GeminiFunctionResponse
import com.herpace.data.remote.dto.GeminiFunctionResult
import com.herpace.data.remote.dto.GeminiGenerationConfig
import com.herpace.data.remote.dto.GeminiMediaChunk
import com.herpace.data.remote.dto.GeminiPrebuiltVoiceConfig
import com.herpace.data.remote.dto.GeminiRealtimeInput
import com.herpace.data.remote.dto.GeminiRealtimeInputMessage
import com.herpace.data.remote.dto.GeminiSetup
import com.herpace.data.remote.dto.GeminiSetupMessage
import com.herpace.data.remote.dto.GeminiSpeechConfig
import com.herpace.data.remote.dto.GeminiSystemInstruction
import com.herpace.data.remote.dto.GeminiTextPart
import com.herpace.data.remote.dto.GeminiThinkingConfig
import com.herpace.data.remote.dto.GeminiTool
import com.herpace.data.remote.dto.GeminiToolResponse
import com.herpace.data.remote.dto.GeminiToolResponseMessage
import com.herpace.data.remote.dto.GeminiVoiceConfig
import com.herpace.domain.model.VoiceSessionToken
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.boolean
import kotlinx.serialization.json.booleanOrNull
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.double
import kotlinx.serialization.json.doubleOrNull
import kotlinx.serialization.json.int
import kotlinx.serialization.json.intOrNull
import kotlinx.serialization.json.jsonArray
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive
import kotlinx.serialization.json.put
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.Response
import okhttp3.WebSocket
import okhttp3.WebSocketListener

/**
 * Manages the WebSocket connection to the Gemini Live API.
 * Handles setup, sending audio chunks, receiving responses, and tool calls.
 */
class GeminiWebSocketManager(
    private val okHttpClient: OkHttpClient
) {

    companion object {
        private const val TAG = "GeminiWebSocket"
    }

    interface Callback {
        fun onSetupComplete()
        fun onAudioResponse(base64Audio: String)
        fun onTranscript(text: String, isFinal: Boolean)
        fun onToolCall(name: String, args: Map<String, Any?>, callId: String)
        fun onTurnComplete()
        fun onInterrupted()
        fun onError(message: String)
        fun onDisconnected(wasClean: Boolean)
    }

    private val json = Json {
        ignoreUnknownKeys = true
        isLenient = true
        encodeDefaults = true
    }

    private var webSocket: WebSocket? = null
    private var callback: Callback? = null

    val isConnected: Boolean get() = webSocket != null

    fun connect(token: VoiceSessionToken, callback: Callback) {
        this.callback = callback

        val request = Request.Builder()
            .url(token.webSocketUrl)
            .build()

        webSocket = okHttpClient.newWebSocket(request, object : WebSocketListener() {
            override fun onOpen(webSocket: WebSocket, response: Response) {
                Log.d(TAG, "WebSocket connected to Gemini Live API")
                sendSetupMessage(token)
            }

            override fun onMessage(webSocket: WebSocket, text: String) {
                handleMessage(text)
            }

            override fun onFailure(webSocket: WebSocket, t: Throwable, response: Response?) {
                Log.e(TAG, "WebSocket failure: ${t.message}", t)
                callback.onError(t.message ?: "WebSocket connection failed")
                callback.onDisconnected(false)
                this@GeminiWebSocketManager.webSocket = null
            }

            override fun onClosing(webSocket: WebSocket, code: Int, reason: String) {
                Log.d(TAG, "WebSocket closing: $code $reason")
                webSocket.close(1000, null)
            }

            override fun onClosed(webSocket: WebSocket, code: Int, reason: String) {
                Log.d(TAG, "WebSocket closed: $code $reason")
                val wasClean = code == 1000 || code == 1001
                callback.onDisconnected(wasClean)
                this@GeminiWebSocketManager.webSocket = null
            }
        })
    }

    private fun sendSetupMessage(token: VoiceSessionToken) {
        val toolParameters = buildJsonObject {
            put("type", "object")
            put("properties", buildJsonObject {
                put("actualDistance", buildJsonObject {
                    put("type", "number")
                    put("description", "Actual distance covered, in kilometers")
                })
                put("actualDuration", buildJsonObject {
                    put("type", "number")
                    put("description", "Actual workout duration, in minutes")
                })
                put("rpe", buildJsonObject {
                    put("type", "integer")
                    put("description", "Rate of Perceived Exertion, 1 (very easy) to 10 (max effort)")
                })
                put("notes", buildJsonObject {
                    put("type", "string")
                    put("description", "Optional notes from the user about their workout")
                })
            })
            put("required", kotlinx.serialization.json.buildJsonArray {
                add(kotlinx.serialization.json.JsonPrimitive("actualDistance"))
                add(kotlinx.serialization.json.JsonPrimitive("actualDuration"))
                add(kotlinx.serialization.json.JsonPrimitive("rpe"))
            })
        }

        val setupMessage = GeminiSetupMessage(
            setup = GeminiSetup(
                model = token.model,
                generationConfig = GeminiGenerationConfig(
                    responseModalities = listOf("AUDIO"),
                    thinkingConfig = GeminiThinkingConfig(thinkingBudget = 0),
                    speechConfig = GeminiSpeechConfig(
                        voiceConfig = GeminiVoiceConfig(
                            prebuiltVoiceConfig = GeminiPrebuiltVoiceConfig(voiceName = "Aoede")
                        )
                    )
                ),
                tools = listOf(
                    GeminiTool(
                        functionDeclarations = listOf(
                            GeminiFunctionDeclaration(
                                name = "log_workout_completion",
                                description = "Called when the user has provided all required workout completion details. Invoke this after confirming the collected values with the user.",
                                parameters = toolParameters
                            )
                        )
                    )
                ),
                systemInstruction = token.systemInstruction?.let {
                    GeminiSystemInstruction(parts = listOf(GeminiTextPart(text = it)))
                },
                inputAudioTranscription = JsonObject(emptyMap()),
                outputAudioTranscription = JsonObject(emptyMap())
            )
        )

        val messageJson = json.encodeToString(setupMessage)
        Log.d(TAG, "Sending setup message")
        webSocket?.send(messageJson)
    }

    fun sendAudioChunk(base64Audio: String) {
        val message = GeminiRealtimeInputMessage(
            realtimeInput = GeminiRealtimeInput(
                mediaChunks = listOf(
                    GeminiMediaChunk(data = base64Audio)
                )
            )
        )
        webSocket?.send(json.encodeToString(message))
    }

    fun sendToolResponse(callId: String, functionName: String) {
        val message = GeminiToolResponseMessage(
            toolResponse = GeminiToolResponse(
                functionResponses = listOf(
                    GeminiFunctionResponse(
                        id = callId,
                        name = functionName,
                        response = GeminiFunctionResult(
                            result = "Workout details received for confirmation."
                        )
                    )
                )
            )
        )
        val messageJson = json.encodeToString(message)
        Log.d(TAG, "Sending tool response for $functionName")
        webSocket?.send(messageJson)
    }

    private fun handleMessage(text: String) {
        try {
            val message = json.parseToJsonElement(text).jsonObject

            // Handle error
            if (message.containsKey("error")) {
                val error = message["error"]?.jsonObject
                val errorMsg = error?.get("message")?.jsonPrimitive?.content
                    ?: error?.get("status")?.jsonPrimitive?.content
                    ?: "Unknown Gemini error"
                Log.e(TAG, "Gemini error: $errorMsg")
                callback?.onError(errorMsg)
                return
            }

            // Handle goAway
            if (message.containsKey("goAway")) {
                Log.w(TAG, "Gemini server sent goAway")
                return
            }

            // Handle setupComplete - Gemini sends this as an empty object: {"setupComplete": {}}
            if (message.containsKey("setupComplete")) {
                Log.d(TAG, "Setup complete received")
                callback?.onSetupComplete()
                return
            }

            // Handle toolCall
            if (message.containsKey("toolCall")) {
                val toolCall = message["toolCall"]?.jsonObject
                val functionCalls = toolCall?.get("functionCalls")?.jsonArray
                functionCalls?.forEach { callElement ->
                    val call = callElement.jsonObject
                    val name = call["name"]?.jsonPrimitive?.content ?: return@forEach
                    val id = call["id"]?.jsonPrimitive?.content ?: return@forEach
                    val argsObj = call["args"]?.jsonObject

                    val args = mutableMapOf<String, Any?>()
                    argsObj?.forEach { (key, value) ->
                        args[key] = try {
                            value.jsonPrimitive.doubleOrNull
                                ?: value.jsonPrimitive.intOrNull
                                ?: value.jsonPrimitive.booleanOrNull
                                ?: value.jsonPrimitive.content
                        } catch (_: Exception) {
                            value.toString()
                        }
                    }

                    Log.d(TAG, "Tool call: $name, args: $args, id: $id")
                    callback?.onToolCall(name, args, id)
                }
                return
            }

            // Handle serverContent
            if (message.containsKey("serverContent")) {
                val serverContent = message["serverContent"]?.jsonObject ?: return

                // Check for interruption
                val interrupted = serverContent["interrupted"]?.jsonPrimitive?.boolean ?: false
                if (interrupted) {
                    callback?.onInterrupted()
                    return
                }

                val modelTurn = serverContent["modelTurn"]?.jsonObject
                val parts = modelTurn?.get("parts")?.jsonArray

                parts?.forEach { partElement ->
                    val part = partElement.jsonObject

                    // Text transcript
                    val text = part["text"]?.jsonPrimitive?.content
                    if (text != null) {
                        val turnComplete = serverContent["turnComplete"]?.jsonPrimitive?.boolean ?: false
                        callback?.onTranscript(text, turnComplete)
                    }

                    // Audio data
                    val inlineData = part["inlineData"]?.jsonObject
                    if (inlineData != null) {
                        val mimeType = inlineData["mimeType"]?.jsonPrimitive?.content ?: ""
                        if (mimeType.startsWith("audio/")) {
                            val data = inlineData["data"]?.jsonPrimitive?.content
                            if (data != null) {
                                callback?.onAudioResponse(data)
                            }
                        }
                    }
                }

                val turnComplete = serverContent["turnComplete"]?.jsonPrimitive?.boolean ?: false
                if (turnComplete) {
                    callback?.onTurnComplete()
                }
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error parsing WebSocket message", e)
        }
    }

    fun disconnect() {
        webSocket?.close(1000, "Session ended")
        webSocket = null
        callback = null
    }
}
