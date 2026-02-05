import * as React from 'react'
import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { Route, Timer, Activity, MoreVertical, Calendar, Snowflake, Sun, Leaf, Sprout, Mic, TrendingUp } from 'lucide-react'
import { cn, displayDistance } from '@/lib/utils'
import type { SessionDetailDto, CyclePhaseTipsDto, CompleteSessionRequest, SessionCompletionResponse, TrainingStageInfoDto } from '@/types/api'
import { CyclePhase, WorkoutType, IntensityLevel } from '@/types/api'
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover'
import { TRAINING_STAGES } from '@/lib/trainingStages'
import { CompleteSessionDialog } from './CompleteSessionDialog'
import { VoiceModal } from '@/components/voice/VoiceModal'
import { api } from '@/lib/api-client'
import type { VoiceSessionContextDto } from '@/types/voice'

export interface SessionStep {
  number: number
  title: string
  duration?: number
  instructions: string[]
}

export interface SessionContentProps {
  heading?: string
  steps: SessionStep[]
}

export interface WorkoutSessionCardProps {
  // Support both legacy props format and new SessionDetailDto format
  session?: SessionDetailDto
  cyclePhaseTips?: CyclePhaseTipsDto
  onSessionUpdated?: () => void

  // Legacy props (for Storybook)
  sessionName?: string
  distance?: number
  distanceUnit?: 'km' | 'mi'
  durationMinutes?: number
  zone?: string
  intensityLevel?: IntensityLevel
  cyclePhases?: {
    phaseName: string
    icon?: React.ReactNode
  }[]
  sessionProgress?: string
  warmupContent?: React.ReactNode
  sessionContent?: SessionContentProps
  recoverContent?: React.ReactNode
  onMenuClick?: () => void
}

// Cycle phase icon mapping
const cyclePhaseIcons: Record<CyclePhase, React.ReactNode> = {
  [CyclePhase.Menstrual]: <Snowflake className="h-4 w-4" />,
  [CyclePhase.Follicular]: <Sprout className="h-4 w-4" />,
  [CyclePhase.Ovulatory]: <Sun className="h-4 w-4" />,
  [CyclePhase.Luteal]: <Leaf className="h-4 w-4" />,
}

const cyclePhaseLabels: Record<CyclePhase, string> = {
  [CyclePhase.Menstrual]: 'Menstrual',
  [CyclePhase.Follicular]: 'Follicular',
  [CyclePhase.Ovulatory]: 'Ovulatory',
  [CyclePhase.Luteal]: 'Luteal',
}

export function WorkoutSessionCard(props: WorkoutSessionCardProps) {
  const [isCompleteDialogOpen, setIsCompleteDialogOpen] = useState(false)
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false)
  const [isSkipping, setIsSkipping] = useState(false)
  const [localSession, setLocalSession] = useState(props.session)

  // Determine if we're using session DTO or legacy props
  const isSessionMode = !!props.session
  const isRestDay = isSessionMode && localSession?.workoutType === WorkoutType.Rest

  // Auto-complete rest days on mount — no action required from the user.
  // Optimistic: mark completed immediately so the UI never flickers to "pending".
  useEffect(() => {
    if (isRestDay && localSession && !localSession.isCompleted && !localSession.isSkipped) {
      setLocalSession(prev => prev ? { ...prev, isCompleted: true } : prev)
      api.put<Record<string, never>, SessionCompletionResponse>(
        `/api/sessions/${localSession.id}/complete`,
        {}
      ).catch((err: unknown) => {
        console.error('Failed to auto-complete rest day:', err)
      })
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Extract values from either session or legacy props
  const sessionName = isSessionMode ? localSession!.sessionName : props.sessionName!
  const distanceRawKm = isSessionMode ? localSession!.distance : props.distance
  const distanceUnit = props.distanceUnit || 'km'
  const distance = distanceRawKm != null ? displayDistance(distanceRawKm, distanceUnit) : undefined
  const durationMinutes = isSessionMode ? localSession!.durationMinutes : props.durationMinutes
  const zone = props.zone // Zone info not in session DTO, use legacy prop
  const intensityLevel = isSessionMode ? localSession?.intensityLevel : props.intensityLevel

  // Build cycle phases from session
  const cyclePhases = isSessionMode && localSession!.cyclePhase !== undefined
    ? [{
        phaseName: `${cyclePhaseLabels[localSession!.cyclePhase]} Phase`,
        icon: cyclePhaseIcons[localSession!.cyclePhase]
      }]
    : props.cyclePhases

  // Parse session description into workout content
  const sessionContent: SessionContentProps = isSessionMode
    ? {
        heading: 'Workout Details',
        steps: localSession!.sessionDescription
          ? [{
              number: 1,
              title: 'Session',
              instructions: [localSession!.sessionDescription]
            }]
          : []
      }
    : props.sessionContent!

  // Generate warmup content from session data
  const warmupContent = React.useMemo(() => {
    // Use legacy prop if provided (for Storybook backward compatibility)
    if (props.warmupContent) return props.warmupContent

    // Otherwise use session data if in session mode
    if (isSessionMode && localSession?.warmUp) {
      return (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-[#3d3826]">Warmup</h3>
          <p className="text-sm text-[#85837d] leading-relaxed whitespace-pre-line">
            {localSession.warmUp}
          </p>
        </div>
      )
    }

    return undefined
  }, [isSessionMode, localSession?.warmUp, props.warmupContent])

  // Generate recovery content from session data
  const recoverContent = React.useMemo(() => {
    // Use legacy prop if provided (for Storybook backward compatibility)
    if (props.recoverContent) return props.recoverContent

    // Otherwise use session data if in session mode
    if (isSessionMode && localSession?.recovery) {
      return (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-[#3d3826]">Recovery</h3>
          <p className="text-sm text-[#85837d] leading-relaxed whitespace-pre-line">
            {localSession.recovery}
          </p>
        </div>
      )
    }

    return undefined
  }, [isSessionMode, localSession?.recovery, props.recoverContent])

  const sessionProgress = props.sessionProgress

  const handleSkip = async () => {
    if (!isSessionMode || !localSession) return

    setIsSkipping(true)
    try {
      const response = await api.put<{ skipReason?: string }, SessionCompletionResponse>(
        `/api/sessions/${localSession.id}/skip`,
        {}
      )

      console.log('Session skipped successfully:', response)
      setLocalSession({ ...localSession, isSkipped: true })
      props.onSessionUpdated?.()
    } catch (error) {
      console.error('Error skipping session:', error)
      alert('Failed to skip session. Please try again.')
    } finally {
      setIsSkipping(false)
    }
  }

  const handleComplete = async (data: CompleteSessionRequest) => {
    if (!isSessionMode || !localSession) return

    const response = await api.put<CompleteSessionRequest, SessionCompletionResponse>(
      `/api/sessions/${localSession.id}/complete`,
      data
    )

    console.log('Session completed successfully:', response)
    setLocalSession({
      ...localSession,
      isCompleted: true,
      actualDistance: data.actualDistance,
      actualDuration: data.actualDuration,
      rpe: data.rpe,
      userNotes: data.userNotes
    })

    props.onSessionUpdated?.()
  }
  // Format date for display
  const sessionDate = isSessionMode && localSession ? new Date(localSession.scheduledDate) : new Date()
  const dayOfWeek = sessionDate.toLocaleDateString('en-US', { weekday: 'short' })
  const monthDay = sessionDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  const dateString = `${dayOfWeek} ${monthDay}`


  // Build session progress text
  const progressText = isSessionMode && localSession?.sessionNumberInPhase && localSession?.totalSessionsInPhase
    ? `Session ${localSession.sessionNumberInPhase}/${localSession.totalSessionsInPhase} This Phase`
    : sessionProgress

  // Build menstruation day text
  const menstruationText = isSessionMode && localSession?.menstruationDay
    ? `Menstruation Day ${localSession.menstruationDay}`
    : null

  // Get phase guidance from session (brief cycle-specific tip from Gemini)
  const phaseGuidance = isSessionMode ? localSession?.phaseGuidance : null

  // Get workout tips from session (3 AI-generated tips)
  const workoutTips = React.useMemo(() => {
    if (isSessionMode && localSession?.workoutTips) {
      return localSession.workoutTips
    }
    return []
  }, [isSessionMode, localSession])

  // Get cycle wellness tips (nutrition, rest, etc.) - only when passed via props
  const cycleWellnessTips = React.useMemo(() => {
    const tips: string[] = []
    if (props.cyclePhaseTips) {
      if (props.cyclePhaseTips.nutritionTips.length > 0) {
        tips.push(...props.cyclePhaseTips.nutritionTips.slice(0, 1)) // Take first nutrition tip
      }
      if (props.cyclePhaseTips.restTips.length > 0) {
        tips.push(...props.cyclePhaseTips.restTips.slice(0, 1)) // Take first rest tip
      }
    }
    return tips
  }, [props.cyclePhaseTips])

  // Combined tips for display (workout tips + cycle wellness tips)
  const allTips = React.useMemo(() => {
    return [...workoutTips, ...cycleWellnessTips]
  }, [workoutTips, cycleWellnessTips])

  // Training stage info: prefer server-hydrated data, fall back to client-side library
  const stageInfo: TrainingStageInfoDto | null = React.useMemo(() => {
    if (!isSessionMode || !localSession) return null
    if (localSession.trainingStageInfo) return localSession.trainingStageInfo
    if (localSession.trainingStage !== undefined && localSession.trainingStage !== null) {
      return TRAINING_STAGES[localSession.trainingStage] ?? null
    }
    return null
  }, [isSessionMode, localSession?.trainingStageInfo, localSession?.trainingStage])

  return (
    <div className="w-full">
      {/* Phase tracking section */}
      {(cyclePhases && cyclePhases.length > 0) || menstruationText || progressText || stageInfo ? (
        <div className="bg-[#fefdfb] border border-[#ebe8e2] rounded-t-lg px-2 pb-3 flex items-center gap-3 flex-wrap mb-[-12px] w-fit">
          {cyclePhases?.map((phase, index) => (
            <React.Fragment key={index}>
              {index > 0 && (
                <Separator orientation="vertical" className="h-7 bg-[#ebe8e2]" />
              )}
              <div className="flex items-center gap-2 text-sm text-[#696863] font-medium">
                <div className="flex items-center justify-center h-4 w-4">
                  {phase.icon || <Calendar className="h-4 w-4" />}
                </div>
                <p className="leading-[20px]">{phase.phaseName}</p>
              </div>
            </React.Fragment>
          ))}
          {menstruationText && (
            <>
              {cyclePhases && cyclePhases.length > 0 && (
                <Separator orientation="vertical" className="h-7 bg-[#ebe8e2]" />
              )}
              <div className="flex items-center gap-2 text-sm text-[#ed7c7c] font-medium">
                <Snowflake className="h-4 w-4" />
                <p className="leading-[20px]">{menstruationText}</p>
              </div>
            </>
          )}
          {progressText && (
            <>
              {((cyclePhases && cyclePhases.length > 0) || menstruationText) && (
                <Separator orientation="vertical" className="h-7 bg-[#ebe8e2]" />
              )}
              <div className="flex items-center justify-center px-2 py-0.5">
                <p className="text-[#696863] text-xs font-normal leading-[16px]">
                  {progressText}
                </p>
              </div>
            </>
          )}

          {/* Training stage badge with info popover */}
          {stageInfo && (
            <>
              {((cyclePhases && cyclePhases.length > 0) || menstruationText || progressText) && (
                <Separator orientation="vertical" className="h-7 bg-[#ebe8e2]" />
              )}
              <Popover>
                <PopoverTrigger asChild>
                  <div className="flex items-center gap-1.5 text-sm text-[#696863] font-medium cursor-pointer hover:text-[#3d3826] transition-colors">
                    <TrendingUp className="h-4 w-4" />
                    <p className="leading-[20px]">{stageInfo.name} Stage</p>
                  </div>
                </PopoverTrigger>
                <PopoverContent className="w-72 bg-[#fcf9f3] border-[#ebe8e2]" align="start">
                  <div className="space-y-2">
                    <div>
                      <h4 className="text-sm font-semibold text-[#3d3826]">{stageInfo.name} — {stageInfo.tagline}</h4>
                      <p className="text-xs text-[#85837d] mt-1 leading-relaxed">{stageInfo.description}</p>
                    </div>
                    <div className="border-t border-[#ebe8e2] pt-2 space-y-1.5">
                      <p className="text-xs text-[#696863]"><span className="font-medium">Focus:</span> {stageInfo.focus}</p>
                      <p className="text-xs text-[#696863]"><span className="font-medium">What to expect:</span> {stageInfo.whatToExpect}</p>
                      <p className="text-xs text-[#696863]"><span className="font-medium">Tip:</span> {stageInfo.tip}</p>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </>
          )}
        </div>
      ) : null}

      {/* Main card */}
      <Card
        className={cn(
          'bg-[#fcf9f3] border-[#ebe8e2] shadow-[4px_4px_0px_0px_#f3f0e7]',
          cyclePhases && cyclePhases.length > 0
            ? 'rounded-tl-none rounded-tr-2xl rounded-b-2xl'
            : 'rounded-2xl'
        )}
      >
        <CardContent className="p-4">
          {/* Header with session name and metrics */}
          <div className="flex gap-4 items-start mb-4">
            {/* Session name and metrics */}
            <div className="flex-1 flex flex-col gap-2">
              {/* Date */}
              {isSessionMode && (
                <div className="text-sm text-[#696863]">
                  {dateString}
                </div>
              )}
              <div className="flex justify-between items-start gap-4">
                <h2 className="text-2xl font-semibold text-[#3d3826] font-[family-name:'Petrona']">
                  {sessionName}
                </h2>
                {props.onMenuClick && (
                  <button
                    onClick={props.onMenuClick}
                    className="text-[#3d3826] hover:bg-[#f3f0e7] rounded p-1 transition-colors"
                    aria-label="More options"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* Metrics badges on right */}
              <div className="flex gap-2 flex-wrap">
                {distance && (
                  <Badge
                    variant="outline"
                    className="bg-white border-[#ebe8e2] text-[#696863] text-xs font-normal"
                  >
                    <Route className="h-3.5 w-3.5 mr-1.5" />
                    {distance} {distanceUnit === 'mi' ? 'mi' : 'km'}
                  </Badge>
                )}
                {durationMinutes && (
                  <Badge
                    variant="outline"
                    className="bg-white border-[#ebe8e2] text-[#696863] text-xs font-normal"
                  >
                    <Timer className="h-3.5 w-3.5 mr-1.5" />
                    {durationMinutes} Min
                  </Badge>
                )}
                {zone && (
                  <Badge
                    variant="outline"
                    className="bg-white border-[#ebe8e2] text-[#696863] text-xs font-normal"
                  >
                    <Activity className="h-3.5 w-3.5 mr-1.5" />
                    {zone}
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Tabs for Warmup/Session/Recover */}
          <Tabs defaultValue="session" className="w-full">
            <TabsList className="w-full bg-[#f3f0e7] p-[3px] h-auto rounded-[10px] mb-4">
              {warmupContent && (
                <TabsTrigger
                  value="warmup"
                  className="flex-1 text-[#3d3826] text-sm font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-[10px] py-1"
                >
                  Warmup
                </TabsTrigger>
              )}
              <TabsTrigger
                value="session"
                className="flex-1 text-[#3d3826] text-sm font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-[10px] py-1"
              >
                Session
              </TabsTrigger>
              {recoverContent && (
                <TabsTrigger
                  value="recover"
                  className="flex-1 text-[#3d3826] text-sm font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-[10px] py-1"
                >
                  Recover
                </TabsTrigger>
              )}
            </TabsList>

            {warmupContent && (
              <TabsContent value="warmup" className="mt-0">
                <div className="bg-[#f3f0e7] rounded-lg p-4">
                  {typeof warmupContent === 'object' &&
                  'props' in warmupContent &&
                  warmupContent.props.steps ? (
                    <WarmupSteps steps={warmupContent.props.steps} />
                  ) : (
                    warmupContent
                  )}
                </div>
              </TabsContent>
            )}

            <TabsContent value="session" className="mt-0">
              <div className="bg-[#f3f0e7] rounded-lg p-4">
                {/* Show phase guidance insight if available */}
                {phaseGuidance && (
                  <div className="mb-4 p-3 bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg">
                    <p className="text-sm font-medium text-purple-700">
                      💡 {phaseGuidance}
                    </p>
                  </div>
                )}

                {/* Show workout tips if available */}
                {allTips.length > 0 ? (
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium text-[#3d3826]">
                      Workout Tips
                    </h3>
                    <ul className="space-y-3">
                      {allTips.map((tip, index) => (
                        <li
                          key={index}
                          className="text-sm text-[#85837d] leading-relaxed list-disc ml-5"
                        >
                          {tip}
                        </li>
                      ))}
                    </ul>

                    {/* Show session description if available */}
                    {sessionContent.steps.length > 0 && sessionContent.steps[0].instructions.length > 0 && (
                      <div className="mt-6 pt-4 border-t border-[#ebe8e2]">
                        <h3 className="text-sm font-medium text-[#3d3826] mb-3">
                          Session Details
                        </h3>
                        <ul className="space-y-2">
                          {sessionContent.steps[0].instructions.map((instruction, index) => (
                            <li
                              key={index}
                              className="text-sm text-[#85837d] leading-relaxed list-disc ml-5"
                            >
                              {instruction}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ) : (
                  // Fallback to original step display if no tips
                  <>
                    {sessionContent.heading && (
                      <h3 className="text-sm font-medium text-[#3d3826] mb-4">
                        {sessionContent.heading}
                      </h3>
                    )}
                    <div className="space-y-8">
                      {sessionContent.steps.map((step, stepIndex) => (
                        <div key={step.number} className="relative">
                          <div className="flex gap-4">
                            {/* Step number indicator */}
                            <div className="flex-shrink-0 relative">
                              <div className="w-[38px] h-[38px] rounded-full bg-[#45423a] text-white flex items-center justify-center text-lg font-medium">
                                {step.number}
                              </div>
                              {/* Connecting line to next step */}
                              {stepIndex < sessionContent.steps.length - 1 && (
                                <div className="absolute top-[45px] left-[18px] w-0.5 h-[calc(100%+16px)] bg-[rgba(71,72,87,0.2)]" />
                              )}
                            </div>

                            {/* Step content */}
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h4 className="text-base font-normal text-[#141414]">
                                  {step.title}
                                </h4>
                                {step.duration && (
                                  <Badge
                                    variant="outline"
                                    className="bg-white border-[#ebe8e2] text-[#696863] text-xs font-normal"
                                  >
                                    <Timer className="h-3.5 w-3.5 mr-1.5" />
                                    {step.duration} Min
                                  </Badge>
                                )}
                              </div>
                              <ul className="space-y-1">
                                {step.instructions.map((instruction, index) => (
                                  <li
                                    key={index}
                                    className="text-sm text-[#85837d] leading-relaxed list-disc ml-5"
                                  >
                                    {instruction}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </TabsContent>

            {recoverContent && (
              <TabsContent value="recover" className="mt-0">
                <div className="bg-[#f3f0e7] rounded-lg p-4">{recoverContent}</div>
              </TabsContent>
            )}
          </Tabs>

          {/* Completion status and action buttons (only in session mode) */}
          {isSessionMode && localSession && (
            <div className="mt-6 space-y-4">
              {/* Completion status */}
              {localSession.isCompleted && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-sm font-medium text-green-800">✓ Completed</p>
                  {localSession.actualDistance && (
                    <p className="text-xs text-green-700 mt-1">
                      Actual: {displayDistance(localSession.actualDistance, distanceUnit)} {distanceUnit} in {localSession.actualDuration} min
                    </p>
                  )}
                  {localSession.rpe && (
                    <p className="text-xs text-green-700">RPE: {localSession.rpe}/10</p>
                  )}
                </div>
              )}

              {localSession.isSkipped && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <p className="text-sm font-medium text-gray-800">Skipped</p>
                </div>
              )}


              {/* Action buttons */}
              {isRestDay ? (
                /* Rest day: completed by default. Only offer optional workout log
                   if the user hasn't already logged one. */
                localSession.isCompleted && !localSession.actualDistance && !localSession.actualDuration && (
                  <Button size="sm" variant="outline" onClick={() => setIsCompleteDialogOpen(true)}>
                    Log a Workout
                  </Button>
                )
              ) : (
                /* Regular workout day: full action set */
                !localSession.isCompleted && !localSession.isSkipped && (
                  <div className="space-y-3">
                    {/* Primary actions: Complete and Skip */}
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => setIsCompleteDialogOpen(true)}
                        className="flex-1"
                      >
                        Complete Session
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleSkip}
                        disabled={isSkipping}
                        className="flex-1"
                      >
                        {isSkipping ? 'Skipping...' : 'Skip Session'}
                      </Button>
                    </div>
                    {/* Secondary action: Voice chat */}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setIsVoiceModalOpen(true)}
                      className="w-full bg-rose-50 hover:bg-rose-100 border-rose-200 text-rose-700"
                    >
                      <Mic className="h-4 w-4 mr-1.5" />
                      Chat about this session
                    </Button>
                  </div>
                )
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Complete Session Dialog */}
      {isSessionMode && localSession && (
        <CompleteSessionDialog
          session={localSession}
          open={isCompleteDialogOpen}
          onOpenChange={setIsCompleteDialogOpen}
          onComplete={handleComplete}
          distanceUnit={distanceUnit}
          startInLogMode={isRestDay}
        />
      )}

      {/* Voice Modal */}
      {isSessionMode && localSession && (
        <VoiceModal
          open={isVoiceModalOpen}
          onOpenChange={setIsVoiceModalOpen}
          sessionId={localSession.id}
          sessionContext={{
            sessionId: localSession.id,
            sessionName: localSession.sessionName,
            workoutType: localSession.workoutType,
            plannedDistance: localSession.distance ?? undefined,
            plannedDuration: localSession.durationMinutes ?? undefined,
            cyclePhase: localSession.cyclePhase ?? undefined,
            phaseGuidance: localSession.phaseGuidance ?? undefined,
            workoutTips: localSession.workoutTips || [],
            intensityLevel: localSession.intensityLevel
          } as VoiceSessionContextDto}
          onComplete={() => {
            setLocalSession({
              ...localSession,
              isCompleted: true
            })
            props.onSessionUpdated?.()
          }}
        />
      )}
    </div>
  )
}

// Helper component for rendering warmup steps with the same styling
function WarmupSteps({ steps }: { steps: SessionStep[] }) {
  return (
    <>
      <h3 className="text-sm font-medium text-[#3d3826] mb-4">Warmup</h3>
      <div className="space-y-8">
        {steps.map((step, stepIndex) => (
          <div key={step.number} className="relative">
            <div className="flex gap-4">
              {/* Step number indicator */}
              <div className="flex-shrink-0 relative">
                <div className="w-[38px] h-[38px] rounded-full bg-[#45423a] text-white flex items-center justify-center text-lg font-medium">
                  {step.number}
                </div>
                {/* Connecting line to next step */}
                {stepIndex < steps.length - 1 && (
                  <div className="absolute top-[45px] left-[18px] w-0.5 h-[calc(100%+16px)] bg-[rgba(71,72,87,0.2)]" />
                )}
              </div>

              {/* Step content */}
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h4 className="text-base font-normal text-[#141414]">{step.title}</h4>
                  {step.duration && (
                    <Badge
                      variant="outline"
                      className="bg-white border-[#ebe8e2] text-[#696863] text-xs font-normal"
                    >
                      <Timer className="h-3.5 w-3.5 mr-1.5" />
                      {step.duration} Min
                    </Badge>
                  )}
                </div>
                <ul className="space-y-1">
                  {step.instructions.map((instruction, index) => (
                    <li
                      key={index}
                      className="text-sm text-[#85837d] leading-relaxed list-disc ml-5"
                    >
                      {instruction}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  )
}
