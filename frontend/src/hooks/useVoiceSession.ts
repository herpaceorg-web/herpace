import { useState, useCallback, useRef, useEffect } from 'react'
import { api } from '../lib/api-client'
import {
  requestMicrophoneAccess,
  createAudioProcessor,
  AudioQueue,
  checkAudioSupport
} from '../lib/audio-utils'
import type {
  VoiceSessionState,
  VoiceSessionTokenResponse,
  VoiceSessionTokenRequest,
  VoiceSessionEvents,
  GeminiServerContentMessage
} from '../types/voice'

interface UseVoiceSessionOptions extends VoiceSessionEvents {
  sessionId?: string
}

interface UseVoiceSessionReturn {
  state: VoiceSessionState
  error: string | null
  isSupported: boolean
  startSession: () => Promise<void>
  stopSession: () => void
  sendTextMessage: (text: string) => void
}

export function useVoiceSession(options: UseVoiceSessionOptions = {}): UseVoiceSessionReturn {
  const {
    sessionId,
    onStateChange,
    onTranscript,
    onAudioResponse,
    onToolCall,
    onError,
    onComplete
  } = options

  const [state, setState] = useState<VoiceSessionState>('idle')
  const [error, setError] = useState<string | null>(null)
  const [isSupported, setIsSupported] = useState(true)

  const wsRef = useRef<WebSocket | null>(null)
  const mediaStreamRef = useRef<MediaStream | null>(null)
  const audioProcessorRef = useRef<{ start: () => void; stop: () => void } | null>(null)
  const audioQueueRef = useRef<AudioQueue>(new AudioQueue())

  // Check browser support on mount
  useEffect(() => {
    const support = checkAudioSupport()
    setIsSupported(support.supported)
    if (!support.supported && support.error) {
      setError(support.error)
    }
  }, [])

  // Update state and notify callback
  const updateState = useCallback((newState: VoiceSessionState) => {
    setState(newState)
    onStateChange?.(newState)
  }, [onStateChange])

  // Handle WebSocket messages from Gemini
  const handleMessage = useCallback((event: MessageEvent) => {
    try {
      console.log('WebSocket message received (raw):', event.data)
      const message = JSON.parse(event.data) as GeminiServerContentMessage & {
        error?: { message?: string; code?: number; status?: string }
      }
      console.log('WebSocket message parsed:', message)

      // Handle error responses from Gemini
      if (message.error) {
        const errorMsg = message.error.message || `Gemini API error: ${message.error.status || message.error.code || 'Unknown error'}`
        console.error('Gemini API error:', message.error)
        setError(errorMsg)
        onError?.(new Error(errorMsg))
        updateState('error')
        return
      }

      // Handle setup complete
      if (message.setupComplete) {
        console.log('Setup complete received, transitioning to listening state')
        updateState('listening')
        // Start audio capture
        audioProcessorRef.current?.start()
        return
      }

      // Handle tool calls (e.g., log_workout_completion)
      if (message.toolCall?.functionCalls) {
        for (const call of message.toolCall.functionCalls) {
          onToolCall?.(call.name, call.args)
        }
        return
      }

      // Handle server content (text and audio responses)
      if (message.serverContent) {
        const { modelTurn, turnComplete, interrupted } = message.serverContent

        if (interrupted) {
          // User interrupted the model - clear audio queue
          audioQueueRef.current.clear()
          updateState('listening')
          return
        }

        if (modelTurn?.parts) {
          for (const part of modelTurn.parts) {
            // Handle text response
            if (part.text) {
              onTranscript?.(part.text, !!turnComplete)
            }

            // Handle audio response
            if (part.inlineData?.mimeType.startsWith('audio/')) {
              updateState('responding')
              onAudioResponse?.(part.inlineData.data)
              audioQueueRef.current.enqueue(part.inlineData.data)
            }
          }
        }

        if (turnComplete) {
          // Model finished speaking, go back to listening
          updateState('listening')
        }
      }
    } catch (err) {
      console.error('Error parsing WebSocket message:', err)
    }
  }, [onToolCall, onTranscript, onAudioResponse, updateState])

  // Start a voice session
  const startSession = useCallback(async () => {
    if (!isSupported) {
      setError('Voice features are not supported in your browser')
      return
    }

    try {
      setError(null)
      updateState('connecting')

      // Request microphone access
      const stream = await requestMicrophoneAccess()
      mediaStreamRef.current = stream

      // Get ephemeral token from backend
      const request: VoiceSessionTokenRequest = sessionId ? { sessionId } : {}
      const tokenResponse = await api.post<VoiceSessionTokenRequest, VoiceSessionTokenResponse>(
        '/api/voice/token',
        request
      )

      // Connect to Gemini Live API via WebSocket
      const ws = new WebSocket(tokenResponse.webSocketUrl)
      wsRef.current = ws

      ws.onopen = () => {
        console.log('WebSocket connected to Gemini Live API')

        // Send setup message with model and system instruction
        const setupMessage = {
          setup: {
            model: tokenResponse.model || 'models/gemini-2.5-flash-native-audio-preview-12-2025',
            generationConfig: {
              responseModalities: 'audio',
              speechConfig: {
                voiceConfig: {
                  prebuiltVoiceConfig: {
                    voiceName: 'Aoede'
                  }
                }
              }
            },
            ...(tokenResponse.systemInstruction && {
              systemInstruction: {
                parts: [{ text: tokenResponse.systemInstruction }]
              }
            })
          }
        }

        console.log('Sending setup message:', setupMessage.setup.model)
        ws.send(JSON.stringify(setupMessage))
      }

      ws.onmessage = handleMessage

      ws.onerror = (event) => {
        console.error('WebSocket error:', event)
        const errorMsg = 'Connection error. Please try again.'
        setError(errorMsg)
        onError?.(new Error(errorMsg))
        updateState('error')
      }

      ws.onclose = (event) => {
        console.log('WebSocket closed:', event.code, event.reason)
        if (state !== 'idle' && state !== 'error') {
          onComplete?.()
        }
        cleanup()
        updateState('idle')
      }

      // Create audio processor for microphone input
      audioProcessorRef.current = createAudioProcessor(stream, (base64Data) => {
        if (ws.readyState === WebSocket.OPEN) {
          const message = {
            realtimeInput: {
              mediaChunks: [{
                mimeType: 'audio/pcm;rate=16000',
                data: base64Data
              }]
            }
          }
          ws.send(JSON.stringify(message))
        }
      })

    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to start voice session'
      setError(errorMsg)
      onError?.(err instanceof Error ? err : new Error(errorMsg))
      updateState('error')
      cleanup()
    }
  }, [isSupported, sessionId, handleMessage, updateState, onError, onComplete, state])

  // Stop the voice session
  const stopSession = useCallback(() => {
    cleanup()
    onComplete?.()
    updateState('idle')
  }, [updateState, onComplete])

  // Send a text message (for debugging or alternative input)
  const sendTextMessage = useCallback((text: string) => {
    if (wsRef.current?.readyState !== WebSocket.OPEN) {
      console.warn('WebSocket not connected')
      return
    }

    const message = {
      clientContent: {
        turns: [{
          role: 'user',
          parts: [{ text }]
        }],
        turnComplete: true
      }
    }

    wsRef.current.send(JSON.stringify(message))
    updateState('processing')
  }, [updateState])

  // Cleanup resources
  const cleanup = useCallback(() => {
    // Stop audio processor
    audioProcessorRef.current?.stop()
    audioProcessorRef.current = null

    // Stop media stream
    mediaStreamRef.current?.getTracks().forEach(track => track.stop())
    mediaStreamRef.current = null

    // Close WebSocket
    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }

    // Clear audio queue
    audioQueueRef.current.clear()
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup()
    }
  }, [cleanup])

  return {
    state,
    error,
    isSupported,
    startSession,
    stopSession,
    sendTextMessage
  }
}
