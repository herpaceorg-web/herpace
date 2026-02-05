import { useState, useCallback, useEffect, useRef } from 'react'
import { X, Mic, Volume2, AlertCircle, CheckCircle } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { FloatingVoiceButton } from './VoiceButton'
import { useVoiceSession } from '@/hooks/useVoiceSession'
import { api } from '@/lib/api-client'
import type { VoiceSessionContextDto, VoiceCompletionRequest } from '@/types/voice'
import type { SessionCompletionResponse } from '@/types/api'
import { cn } from '@/lib/utils'

interface VoiceModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  sessionId: string
  sessionContext?: VoiceSessionContextDto
  onComplete?: (response: SessionCompletionResponse) => void
}

export function VoiceModal({
  open,
  onOpenChange,
  sessionId,
  sessionContext,
  onComplete
}: VoiceModalProps) {
  const [transcript, setTranscript] = useState<string>('')
  const [completionData, setCompletionData] = useState<Partial<VoiceCompletionRequest>>({})
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const hasAttemptedConnection = useRef(false)

  const handleTranscript = useCallback((text: string, isFinal: boolean) => {
    if (isFinal) {
      setTranscript(prev => prev + (prev ? ' ' : '') + text)
    }
  }, [])

  const handleToolCall = useCallback((name: string, args: Record<string, unknown>) => {
    console.log('Tool call received:', name, args)

    if (name === 'log_workout_completion') {
      setCompletionData({
        actualDistance: args.actualDistance as number | undefined,
        actualDuration: args.actualDuration as number | undefined,
        rpe: args.rpe as number | undefined,
        userNotes: args.notes as string | undefined,
        voiceTranscript: transcript
      })
      setShowConfirmation(true)
    }
  }, [transcript])

  const handleError = useCallback((error: Error) => {
    console.error('Voice session error:', error)
  }, [])

  const {
    state,
    error,
    isSupported,
    startSession,
    stopSession
  } = useVoiceSession({
    sessionId,
    onTranscript: handleTranscript,
    onToolCall: handleToolCall,
    onError: handleError,
    onComplete: () => {
      // Session ended naturally
    }
  })

  // Start session when modal opens (only once per modal open)
  useEffect(() => {
    if (open && isSupported && state === 'idle' && !hasAttemptedConnection.current) {
      hasAttemptedConnection.current = true
      startSession()
    }
  }, [open, isSupported, state, startSession])

  // Stop session when modal closes and reset connection flag
  useEffect(() => {
    if (!open) {
      if (state !== 'idle') {
        stopSession()
      }
      // Reset flag when modal closes so next open will attempt connection
      hasAttemptedConnection.current = false
    }
  }, [open, state, stopSession])

  // Reset UI state when modal opens
  useEffect(() => {
    if (open) {
      setTranscript('')
      setCompletionData({})
      setShowConfirmation(false)
    }
  }, [open])

  const handleClose = () => {
    stopSession()
    onOpenChange(false)
  }

  const handleConfirmCompletion = async () => {
    if (!completionData) return

    setIsSubmitting(true)
    try {
      const response = await api.post<VoiceCompletionRequest, SessionCompletionResponse>(
        `/api/voice/sessions/${sessionId}/complete`,
        completionData as VoiceCompletionRequest
      )
      onComplete?.(response)
      handleClose()
    } catch (err) {
      console.error('Failed to complete session:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleToggleVoice = () => {
    if (state === 'idle' || state === 'error') {
      startSession()
    } else {
      stopSession()
    }
  }

  const getStatusMessage = () => {
    switch (state) {
      case 'connecting':
        return 'Connecting to voice assistant...'
      case 'listening':
        return 'Listening... Tell me about your workout!'
      case 'processing':
        return 'Processing...'
      case 'responding':
        return 'Coach is responding...'
      case 'error':
        return error || 'Something went wrong. Tap to try again.'
      default:
        return 'Tap the microphone to start'
    }
  }

  if (!isSupported) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              Voice Not Supported
            </DialogTitle>
            <DialogDescription>
              {error || 'Your browser does not support voice features. Please use a modern browser like Chrome, Firefox, or Safari.'}
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  if (showConfirmation) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              Confirm Workout Details
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {completionData.actualDistance !== undefined && (
                <div className="bg-muted p-3 rounded-lg">
                  <div className="text-sm text-muted-foreground">Distance</div>
                  <div className="text-lg font-semibold">{completionData.actualDistance} km</div>
                </div>
              )}
              {completionData.actualDuration !== undefined && (
                <div className="bg-muted p-3 rounded-lg">
                  <div className="text-sm text-muted-foreground">Duration</div>
                  <div className="text-lg font-semibold">{completionData.actualDuration} min</div>
                </div>
              )}
              {completionData.rpe !== undefined && (
                <div className="bg-muted p-3 rounded-lg">
                  <div className="text-sm text-muted-foreground">Effort (RPE)</div>
                  <div className="text-lg font-semibold">{completionData.rpe}/10</div>
                </div>
              )}
            </div>

            {completionData.userNotes && (
              <div className="bg-muted p-3 rounded-lg">
                <div className="text-sm text-muted-foreground">Notes</div>
                <div className="text-sm">{completionData.userNotes}</div>
              </div>
            )}

            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowConfirmation(false)}
              >
                Edit
              </Button>
              <Button
                className="flex-1"
                onClick={handleConfirmCompletion}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Saving...' : 'Confirm'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Voice Assistant</DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={handleClose}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          {sessionContext && (
            <DialogDescription>
              {sessionContext.sessionName}
              {sessionContext.plannedDistance && ` - ${sessionContext.plannedDistance} km`}
            </DialogDescription>
          )}
        </DialogHeader>

        <div className="flex flex-col items-center gap-6 py-8">
          {/* Voice button */}
          <FloatingVoiceButton
            state={state}
            onClick={handleToggleVoice}
          />

          {/* Status message */}
          <p className={cn(
            'text-sm text-center',
            state === 'error' ? 'text-destructive' : 'text-muted-foreground'
          )}>
            {getStatusMessage()}
          </p>

          {/* Visual feedback */}
          <div className="flex items-center gap-2">
            {state === 'listening' && (
              <>
                <Mic className="h-4 w-4 text-rose-500 animate-pulse" />
                <div className="flex gap-1">
                  {[...Array(5)].map((_, i) => (
                    <div
                      key={i}
                      className="w-1 bg-rose-500 rounded-full animate-pulse"
                      style={{
                        height: `${Math.random() * 20 + 10}px`,
                        animationDelay: `${i * 100}ms`
                      }}
                    />
                  ))}
                </div>
              </>
            )}
            {state === 'responding' && (
              <>
                <Volume2 className="h-4 w-4 text-blue-500 animate-pulse" />
                <span className="text-sm text-blue-500">Playing response...</span>
              </>
            )}
          </div>

          {/* Transcript display */}
          {transcript && (
            <div className="w-full max-h-32 overflow-y-auto bg-muted p-3 rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Transcript:</p>
              <p className="text-sm">{transcript}</p>
            </div>
          )}
        </div>

        <div className="flex justify-between">
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          {state !== 'idle' && (
            <Button variant="destructive" onClick={stopSession}>
              Stop
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
