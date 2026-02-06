import { useState, useCallback, useEffect, useRef } from 'react'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Mic, Loader2, CheckCircle } from 'lucide-react'
import { WorkoutType, type SessionDetailDto, type CompleteSessionRequest } from '@/types/api'
import { displayDistance, toKm } from '@/lib/utils'
import { useVoiceSession } from '@/hooks/useVoiceSession'
import { cn } from '@/lib/utils'
import type { VoiceCompletionRequest } from '@/types/voice'
import { api } from '@/lib/api-client'

interface CompleteSessionDialogProps {
  session: SessionDetailDto
  open: boolean
  onOpenChange: (open: boolean) => void
  onComplete: (data: CompleteSessionRequest) => Promise<void>
  distanceUnit: 'km' | 'mi'
  startInLogMode?: boolean
}

type InputMode = 'initial' | 'voice' | 'manual'

export function CompleteSessionDialog({
  session,
  open,
  onOpenChange,
  onComplete,
  distanceUnit,
  startInLogMode = false
}: CompleteSessionDialogProps) {
  const [inputMode, setInputMode] = useState<InputMode>('initial')
  const [actualDistance, setActualDistance] = useState(
    session.distance != null ? displayDistance(session.distance, distanceUnit).toString() : ''
  )
  const [actualDuration, setActualDuration] = useState(session.durationMinutes?.toString() || '')
  const [rpe, setRpe] = useState('')
  const [userNotes, setUserNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoggingWorkout, setIsLoggingWorkout] = useState(startInLogMode)
  const [transcript, setTranscript] = useState<string>('')
  const [completionData, setCompletionData] = useState<Partial<VoiceCompletionRequest>>({})
  const [showConfirmation, setShowConfirmation] = useState(false)
  const hasAttemptedConnection = useRef(false)

  const isRestDay = session.workoutType === WorkoutType.Rest

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
      // Stop voice session when showing confirmation
      stopSession()
    }
  }, [transcript, stopSession])

  const handleError = useCallback((error: Error) => {
    console.error('Voice session error:', error)
  }, [])

  const {
    state,
    error,
    isSupported,
    isSpeaking,
    startSession,
    stopSession
  } = useVoiceSession({
    sessionId: session.id,
    onTranscript: handleTranscript,
    onToolCall: handleToolCall,
    onError: handleError,
    onComplete: () => {
      // Session ended naturally
    }
  })

  // Debug logging - REMOVE after diagnosing
  useEffect(() => {
    console.log('🎤 CompleteSessionDialog Debug:', {
      open,
      inputMode,
      isSupported,
      isRestDay: session.workoutType === WorkoutType.Rest,
      voiceState: state,
      error,
      sessionType: session.workoutType,
      sessionName: session.sessionName,
      showConfirmation,
      hasAttemptedConnection: hasAttemptedConnection.current
    })
  }, [open, inputMode, isSupported, isRestDay, state, error, session, showConfirmation])

  // Debug: Log when reset effect runs
  useEffect(() => {
    console.log('🔄 Reset effect triggered - open:', open, 'state:', state)
  }, [open, state])

  // Start session when voice mode is selected
  useEffect(() => {
    if (inputMode === 'voice' && isSupported && state === 'idle' && !hasAttemptedConnection.current) {
      hasAttemptedConnection.current = true
      startSession()
    }
  }, [inputMode, isSupported, state, startSession])

  // Reset when modal opens/closes
  useEffect(() => {
    if (open) {
      // Reset UI state when modal opens
      setInputMode('initial')
      setTranscript('')
      setCompletionData({})
      setShowConfirmation(false)
      hasAttemptedConnection.current = false
    } else {
      // Cleanup when modal closes - stop voice session if active
      stopSession()
      hasAttemptedConnection.current = false
    }
    // Only depend on 'open' - don't react to state changes!
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    setIsSubmitting(true)
    try {
      if (isRestDay && !isLoggingWorkout) {
        await onComplete({})
        onOpenChange(false)
        return
      }

      const data: CompleteSessionRequest = {
        actualDistance: actualDistance ? toKm(parseFloat(actualDistance), distanceUnit) : undefined,
        actualDuration: actualDuration ? parseInt(actualDuration) : undefined,
        rpe: rpe ? parseInt(rpe) : undefined,
        userNotes: userNotes || undefined
      }

      await onComplete(data)

      // Reset form
      setActualDistance(session.distance != null ? displayDistance(session.distance, distanceUnit).toString() : '')
      setActualDuration(session.durationMinutes?.toString() || '')
      setRpe('')
      setUserNotes('')
      setIsLoggingWorkout(false)

      onOpenChange(false)
    } catch (error) {
      console.error('Error completing session:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleConfirmCompletion = async () => {
    if (!completionData) return

    setIsSubmitting(true)
    try {
      await api.post<VoiceCompletionRequest, any>(
        `/api/voice/sessions/${session.id}/complete`,
        completionData as VoiceCompletionRequest
      )

      // Convert voice completion response to CompleteSessionRequest format
      await onComplete({
        actualDistance: completionData.actualDistance,
        actualDuration: completionData.actualDuration,
        rpe: completionData.rpe,
        userNotes: completionData.userNotes
      })

      onOpenChange(false)
    } catch (err) {
      console.error('Failed to complete session:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleVoiceClick = () => {
    setInputMode('voice')
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
        return 'I\'m listening...'
      case 'processing':
        return 'Analyzing your session...'
      case 'responding':
        return 'Processing...'
      case 'error':
        return error || 'Something went wrong. Click to try again.'
      default:
        return 'Click to start recording'
    }
  }

  // Confirmation screen
  if (showConfirmation) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="font-petrona text-2xl font-normal text-foreground">Complete Training Session</DialogTitle>
            <p className="text-sm font-normal text-[#696863]">{session.sessionName}</p>
          </DialogHeader>

          <div className="bg-muted rounded-lg p-4">
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <h4 className="text-sm font-normal text-foreground">Review your session details</h4>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-3">
              {completionData.actualDistance !== undefined && (
                <div className="bg-card p-3 rounded-md">
                  <div className="text-xs text-[#696863]">Distance</div>
                  <div className="text-lg font-semibold">
                    {displayDistance(completionData.actualDistance, distanceUnit)} {distanceUnit}
                  </div>
                </div>
              )}
              {completionData.actualDuration !== undefined && (
                <div className="bg-card p-3 rounded-md">
                  <div className="text-xs text-[#696863]">Duration</div>
                  <div className="text-lg font-semibold">{completionData.actualDuration} min</div>
                </div>
              )}
              {completionData.rpe !== undefined && (
                <div className="bg-card p-3 rounded-md col-span-2">
                  <div className="text-xs text-[#696863]">Effort (RPE)</div>
                  <div className="text-lg font-semibold">{completionData.rpe}/10</div>
                </div>
              )}
            </div>

            {completionData.userNotes && (
              <div className="bg-card p-3 rounded-md">
                <div className="text-xs text-[#696863] mb-1">Notes</div>
                <div className="text-sm text-foreground">{completionData.userNotes}</div>
              </div>
            )}
          </div>

          <div className="text-center">
            <button
              className="text-sm text-[#696863] hover:text-foreground font-normal"
              onClick={() => setShowConfirmation(false)}
            >
              Edit manually instead
            </button>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleConfirmCompletion} disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Confirm & Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }

  // Voice recording screen
  if (inputMode === 'voice') {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="font-petrona text-2xl font-normal text-foreground">Complete Training Session</DialogTitle>
            <p className="text-sm font-normal text-[#696863]">{session.sessionName}</p>
          </DialogHeader>

          <div className="bg-muted rounded-lg p-6">
            <div className="flex flex-col items-center text-center">
              <button
                onClick={handleToggleVoice}
                disabled={state === 'connecting' || state === 'processing'}
                className={cn(
                  'relative flex items-center justify-center w-16 h-16 rounded-full shadow-lg transition-all mb-4',
                  'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500',
                  'disabled:opacity-50 disabled:cursor-not-allowed',
                  state !== 'idle' && state !== 'error'
                    ? 'bg-rose-500 hover:bg-rose-600 text-white'
                    : 'bg-rose-500 hover:bg-rose-600 text-white',
                  state === 'listening' && 'animate-pulse'
                )}
              >
                {state === 'connecting' || state === 'processing' ? (
                  <Loader2 className="w-8 h-8 animate-spin" />
                ) : (
                  <Mic className="w-8 h-8" />
                )}

                {state === 'listening' && (
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                    <div className="w-2.5 h-2.5 bg-white rounded-full animate-pulse"></div>
                  </div>
                )}
              </button>

              <h4 className="text-sm font-normal text-foreground mb-1">{getStatusMessage()}</h4>
              <p className="text-sm font-normal text-[#696863] mb-4">
                {state === 'idle' ? 'Click the microphone to start' :
                 state === 'listening' ? 'Tell me about your training session' :
                 state === 'processing' ? 'Extracting distance, duration, and effort details' :
                 'Processing your session'}
              </p>

              {/* Animated sound bars - show when listening */}
              {state === 'listening' && (
                <div className="flex gap-1 mb-4">
                  {[12, 18, 24, 16, 20].map((height, i) => (
                    <div
                      key={i}
                      className={cn(
                        "w-1.5 bg-rose-500 rounded-full",
                        isSpeaking && "animate-pulse"
                      )}
                      style={{
                        height: `${height}px`,
                        animationDelay: isSpeaking ? `${i * 100}ms` : '0ms'
                      }}
                    />
                  ))}
                </div>
              )}

              {/* Transcript display */}
              {transcript && (
                <div className="bg-card/80 rounded-lg p-3 mb-4 text-left w-full">
                  <p className="text-sm text-[#696863] font-normal">Transcript:</p>
                  <p className="text-sm text-[#696863] font-normal mt-1">{transcript}</p>
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button disabled className="opacity-50">
              Save Training Session
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }

  // Initial screen or manual form
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="font-petrona text-2xl font-normal text-foreground">Complete Training Session</DialogTitle>
          <p className="text-sm font-normal text-[#696863]">
            How did your {session.sessionName} go?
          </p>
        </DialogHeader>

        {/* DEBUG PANEL - Remove after diagnosis */}
        <div className="bg-blue-50 border border-blue-200 rounded p-3 mb-4 text-xs font-mono">
          <div><strong>Debug Info:</strong></div>
          <div>inputMode: {inputMode}</div>
          <div>isSupported: {String(isSupported)}</div>
          <div>isRestDay: {String(isRestDay)}</div>
          <div>state: {state}</div>
          {error && <div className="text-red-600">error: {error}</div>}
          <div>Conditions met: {String(inputMode === 'initial' && isSupported && !isRestDay)}</div>
        </div>

        <form onSubmit={handleManualSubmit}>
          {/* Show why voice is not available */}
          {inputMode === 'initial' && !isRestDay && !isSupported && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <h4 className="text-sm font-semibold text-yellow-900 mb-1">Voice chat unavailable</h4>
              <p className="text-sm text-yellow-800">
                {error || 'Your browser may not support voice features. Please use a modern browser like Chrome or Firefox.'}
              </p>
            </div>
          )}

          {inputMode === 'initial' && isSupported && !isRestDay && (
            <>
              {/* Voice Option */}
              <div className="bg-muted rounded-lg p-6 mb-6">
                <div className="flex flex-col items-center text-center">
                  <button
                    type="button"
                    onClick={handleVoiceClick}
                    className="w-16 h-16 rounded-full bg-rose-500 hover:bg-rose-600 flex items-center justify-center cursor-pointer transition-colors mb-4"
                  >
                    <Mic className="w-8 h-8 text-white" />
                  </button>
                  <h4 className="text-sm font-normal text-foreground mb-1">Chat about your training session</h4>
                  <p className="text-sm font-normal text-[#696863]">
                    Tell me how it went and I'll log the details for you
                  </p>
                </div>
              </div>

              {/* Divider */}
              <div className="relative mb-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-card text-[#696863] font-normal">or enter manually</span>
                </div>
              </div>
            </>
          )}

          {/* Manual Form Fields */}
          <div className="space-y-6">
            {(!isRestDay || isLoggingWorkout) && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="actualDistance" className="text-sm font-normal text-foreground">
                    Distance ({distanceUnit})
                  </Label>
                  <Input
                    id="actualDistance"
                    type="number"
                    step="0.01"
                    value={actualDistance}
                    onChange={(e) => setActualDistance(e.target.value)}
                    placeholder={session.distance ? displayDistance(session.distance, distanceUnit).toString() : '5.0'}
                    className="w-full px-3 py-2 border border-input rounded-md bg-background"
                  />
                  {session.distance && (
                    <p className="text-xs text-[#696863]">
                      Planned: {displayDistance(session.distance, distanceUnit)} {distanceUnit}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="actualDuration" className="text-sm font-normal text-foreground">
                    Duration (minutes)
                  </Label>
                  <Input
                    id="actualDuration"
                    type="number"
                    value={actualDuration}
                    onChange={(e) => setActualDuration(e.target.value)}
                    placeholder={session.durationMinutes?.toString() || '30'}
                    className="w-full px-3 py-2 border border-input rounded-md bg-background"
                  />
                  {session.durationMinutes && (
                    <p className="text-xs text-[#696863]">
                      Planned: {session.durationMinutes} min
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="rpe" className="text-sm font-normal text-foreground">
                    How did the training session feel? (RPE 1-10)
                  </Label>
                  <Input
                    id="rpe"
                    type="number"
                    min="1"
                    max="10"
                    value={rpe}
                    onChange={(e) => setRpe(e.target.value)}
                    placeholder="1 (very easy) - 10 (maximum effort)"
                    className="w-full px-3 py-2 border border-input rounded-md bg-background"
                    required={!isRestDay || isLoggingWorkout}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="userNotes" className="text-sm font-normal text-foreground">
                    Notes (optional)
                  </Label>
                  <textarea
                    id="userNotes"
                    value={userNotes}
                    onChange={(e) => setUserNotes(e.target.value)}
                    placeholder="How did you feel? Any issues or observations?"
                    className="w-full px-3 py-2 border border-input rounded-md bg-background min-h-[80px]"
                  />
                </div>
              </>
            )}
          </div>

          <DialogFooter className="pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 border border-input rounded-md hover:bg-muted font-normal"
            >
              Cancel
            </Button>
            {isRestDay && !isLoggingWorkout && (
              <Button
                type="button"
                variant="secondary"
                onClick={() => setIsLoggingWorkout(true)}
                disabled={isSubmitting}
              >
                Log a Workout
              </Button>
            )}
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 font-normal"
            >
              {isSubmitting
                ? 'Saving...'
                : isRestDay && !isLoggingWorkout
                  ? 'Confirm Rest Day'
                  : 'Save Training Session'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
