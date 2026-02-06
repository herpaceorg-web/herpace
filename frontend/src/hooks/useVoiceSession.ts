import { useState, useCallback, useRef, useEffect } from 'react'
import { api } from '../lib/api-client'
import {
  requestMicrophoneAccess,
  createAudioProcessor,
  AudioQueue,
  checkAudioSupport,
  closeAudioContexts
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
  isSpeaking: boolean
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
  const [isSpeaking, setIsSpeaking] = useState(false)

  const wsRef = useRef<WebSocket | null>(null)
  const mediaStreamRef = useRef<MediaStream | null>(null)
  const audioProcessorRef = useRef<{ start: () => void; stop: () => void } | null>(null)
  const audioQueueRef = useRef<AudioQueue>(new AudioQueue())
  const setupTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const animationFrameRef = useRef<number | null>(null)

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
      const rawData = event.data instanceof ArrayBuffer
        ? new TextDecoder().decode(event.data)
        : event.data
      console.log('WebSocket message received (raw):', rawData)
      const message = JSON.parse(rawData) as GeminiServerContentMessage & {
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

      // Handle goAway message (server is about to disconnect)
      if ((message as { goAway?: { timeLeft?: string } }).goAway) {
        console.warn('Gemini server sent goAway, will disconnect soon:', (message as { goAway?: { timeLeft?: string } }).goAway)
        return
      }

      // Handle setup complete
      if (message.setupComplete) {
        console.log('Setup complete received, transitioning to listening state')
        if (setupTimeoutRef.current) {
          clearTimeout(setupTimeoutRef.current)
          setupTimeoutRef.current = null
        }
        updateState('listening')
        // Start audio capture
        audioProcessorRef.current?.start()
        return
      }

      // Handle tool calls (e.g., log_workout_completion)
      if (message.toolCall?.functionCalls) {
        for (const call of message.toolCall.functionCalls) {
          onToolCall?.(call.name, call.args)

          // Gemini Live requires a toolResponse to continue the conversation.
          if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({
              toolResponse: {
                functionResponses: [{
                  id: call.id,
                  name: call.name,
                  response: { result: 'Workout details received for confirmation.' }
                }]
              }
            }))
          }
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

      // Create audio processor early - it uses the shared capture context
      // which we'll also use for level detection (consolidating AudioContext instances)
      // The callback uses wsRef.current so it works once WebSocket is connected
      const processor = createAudioProcessor(stream, (base64Data) => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          const message = {
            realtimeInput: {
              mediaChunks: [{
                mimeType: 'audio/pcm;rate=16000',
                data: base64Data
              }]
            }
          }
          wsRef.current.send(JSON.stringify(message))
        }
      })
      audioProcessorRef.current = processor

      // Set up audio level detection using the shared capture context
      try {
        const captureContext = processor.context
        const analyser = captureContext.createAnalyser()
        analyser.fftSize = 256
        analyser.smoothingTimeConstant = 0.8

        const source = captureContext.createMediaStreamSource(stream)
        source.connect(analyser)

        audioContextRef.current = captureContext
        analyserRef.current = analyser

        // Start monitoring audio levels
        const dataArray = new Uint8Array(analyser.frequencyBinCount)
        const SPEECH_THRESHOLD = 30 // Adjust this value based on testing

        const checkAudioLevel = () => {
          if (!analyserRef.current) return

          analyser.getByteFrequencyData(dataArray)
          const average = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length

          // Update isSpeaking state based on audio level
          setIsSpeaking(average > SPEECH_THRESHOLD)

          animationFrameRef.current = requestAnimationFrame(checkAudioLevel)
        }

        checkAudioLevel()
      } catch (err) {
        console.warn('Failed to set up audio level detection:', err)
        // Non-fatal error - voice session can continue without visual feedback
      }

      // Get ephemeral token from backend
      const request: VoiceSessionTokenRequest = sessionId ? { sessionId } : {}
      const tokenResponse = await api.post<VoiceSessionTokenRequest, VoiceSessionTokenResponse>(
        '/api/voice/token',
        request
      )

      // Connect to Gemini Live API via WebSocket
      const ws = new WebSocket(tokenResponse.webSocketUrl)
      ws.binaryType = 'arraybuffer'
      wsRef.current = ws

      ws.onopen = () => {
        console.log('WebSocket connected to Gemini Live API')

        // Send setup message with model, tools, and system instruction
        const setupMessage = {
          setup: {
            model: tokenResponse.model || 'models/gemini-2.5-flash-native-audio-preview-12-2025',
            generationConfig: {
              responseModalities: ['AUDIO'],
              thinkingConfig: {
                thinkingBudget: 0
              },
              speechConfig: {
                voiceConfig: {
                  prebuiltVoiceConfig: {
                    voiceName: 'Aoede'
                  }
                }
              }
            },
            tools: [{
              functionDeclarations: [{
                name: 'log_workout_completion',
                description: 'Called when the user has provided all required workout completion details. Invoke this after confirming the collected values with the user.',
                parameters: {
                  type: 'object',
                  properties: {
                    actualDistance: {
                      type: 'number',
                      description: 'Actual distance covered, in kilometers'
                    },
                    actualDuration: {
                      type: 'number',
                      description: 'Actual workout duration, in minutes'
                    },
                    rpe: {
                      type: 'integer',
                      description: 'Rate of Perceived Exertion, 1 (very easy) to 10 (max effort)'
                    },
                    notes: {
                      type: 'string',
                      description: 'Optional notes from the user about their workout'
                    }
                  },
                  required: ['actualDistance', 'actualDuration', 'rpe']
                }
              }]
            }],
            // Transcription flags — presence enables them for native audio models
            inputAudioTranscription: {},
            outputAudioTranscription: {},
            ...(tokenResponse.systemInstruction && {
              systemInstruction: {
                parts: [{ text: tokenResponse.systemInstruction }]
              }
            })
          }
        }

        console.log('Sending setup message:', JSON.stringify(setupMessage, null, 2))
        ws.send(JSON.stringify(setupMessage))

        // If setupComplete doesn't arrive within 10s, surface an error instead of spinning
        setupTimeoutRef.current = setTimeout(() => {
          console.warn('Setup timeout: no setupComplete received')
          setError('Voice assistant setup timed out. Check console for the setup message that was sent.')
          onError?.(new Error('Setup timeout'))
          updateState('error')
          ws.close()
        }, 10000)
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
        console.log('WebSocket closed:', event.code, event.reason, 'wasClean:', event.wasClean)

        // Cleanup resources
        audioProcessorRef.current?.stop()
        audioProcessorRef.current = null
        mediaStreamRef.current?.getTracks().forEach(track => track.stop())
        mediaStreamRef.current = null
        wsRef.current = null
        audioQueueRef.current.clear()

        // Cleanup audio level detection
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current)
          animationFrameRef.current = null
        }
        // Don't close the shared context here - it will be closed by closeAudioContexts()
        audioContextRef.current = null
        analyserRef.current = null
        setIsSpeaking(false)

        // Close shared audio contexts (playback + capture)
        closeAudioContexts()

        if (event.code !== 1000 && event.code !== 1001) {
          // Abnormal closure — surface the error instead of silently resetting to idle.
          // onerror may have already set an error message; preserve it if so.
          const errorMsg = event.reason || `Connection lost (code: ${event.code})`
          console.warn('WebSocket closed unexpectedly:', errorMsg)
          setError(prev => prev || errorMsg)
          onError?.(new Error(errorMsg))
          updateState('error')
        } else {
          // Clean closure
          onComplete?.()
          updateState('idle')
        }
      }

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
    // Cancel pending setup timeout
    if (setupTimeoutRef.current) {
      clearTimeout(setupTimeoutRef.current)
      setupTimeoutRef.current = null
    }

    // Cancel animation frame for level detection
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
    }
    audioContextRef.current = null
    analyserRef.current = null
    setIsSpeaking(false)

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

    // Close shared audio contexts (playback + capture)
    closeAudioContexts()
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
    isSpeaking,
    startSession,
    stopSession,
    sendTextMessage
  }
}
