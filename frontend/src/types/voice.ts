import type { WorkoutType, CyclePhase, IntensityLevel } from './api'

// Voice session states
export const VoiceSessionState = {
  Idle: 'idle',
  Connecting: 'connecting',
  Listening: 'listening',
  Processing: 'processing',
  Responding: 'responding',
  Error: 'error'
} as const

export type VoiceSessionState = typeof VoiceSessionState[keyof typeof VoiceSessionState]

// Request to get a voice session token
export interface VoiceSessionTokenRequest {
  sessionId?: string
}

// Context about the training session for voice interaction
export interface VoiceSessionContextDto {
  sessionId: string
  sessionName: string
  workoutType: WorkoutType
  plannedDistance?: number
  plannedDuration?: number
  cyclePhase?: CyclePhase
  phaseGuidance?: string
  workoutTips: string[]
  intensityLevel: IntensityLevel
  hrZones?: string
}

// Response containing the ephemeral token
export interface VoiceSessionTokenResponse {
  token: string
  webSocketUrl: string
  expiresAt: string
  sessionContext?: VoiceSessionContextDto
  systemInstruction?: string
  model?: string
}

// Request to complete a session via voice
export interface VoiceCompletionRequest {
  actualDistance?: number
  actualDuration?: number
  rpe?: number
  userNotes?: string
  voiceTranscript?: string
}

// Gemini Live API message types
export interface GeminiSetupMessage {
  setup: {
    model: string
    generationConfig?: {
      responseModalities?: string[]
      speechConfig?: {
        voiceConfig?: {
          prebuiltVoiceConfig?: {
            voiceName?: string
          }
        }
      }
    }
    systemInstruction?: {
      parts: Array<{ text: string }>
    }
  }
}

export interface GeminiRealtimeInputMessage {
  realtimeInput: {
    mediaChunks: Array<{
      mimeType: string
      data: string // base64 encoded audio
    }>
  }
}

export interface GeminiClientContentMessage {
  clientContent: {
    turns: Array<{
      role: 'user'
      parts: Array<{ text: string }>
    }>
    turnComplete: boolean
  }
}

export interface GeminiServerContentMessage {
  serverContent?: {
    modelTurn?: {
      parts?: Array<{
        text?: string
        inlineData?: {
          mimeType: string
          data: string // base64 encoded audio
        }
      }>
    }
    turnComplete?: boolean
    interrupted?: boolean
  }
  toolCall?: {
    functionCalls?: Array<{
      name: string
      args: Record<string, unknown>
      id: string
    }>
  }
  setupComplete?: boolean
}

// Voice session events
export interface VoiceSessionEvents {
  onStateChange?: (state: VoiceSessionState) => void
  onTranscript?: (text: string, isFinal: boolean) => void
  onAudioResponse?: (audioData: string) => void
  onToolCall?: (name: string, args: Record<string, unknown>) => void
  onError?: (error: Error) => void
  onComplete?: () => void
}
