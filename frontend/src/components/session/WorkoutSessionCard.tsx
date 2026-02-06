import * as React from 'react'
import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { Route, Timer, Activity, MoreVertical, Calendar, Snowflake, Sun, Leaf, Sprout, TrendingUp, Sparkles, Heart } from 'lucide-react'
import { cn, displayDistance } from '@/lib/utils'
import type { SessionDetailDto, CyclePhaseTipsDto, CompleteSessionRequest, SessionCompletionResponse, TrainingStageInfoDto } from '@/types/api'
import { CyclePhase, WorkoutType, IntensityLevel } from '@/types/api'
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover'
import { TRAINING_STAGES } from '@/lib/trainingStages'
import { CompleteSessionDialog } from './CompleteSessionDialog'
import { api } from '@/lib/api-client'
import { useToast } from '@/contexts/ToastContext'

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

// Helper function to get phase display info based on cycle phase and menstruation day
const getPhaseDisplayInfo = (phase: CyclePhase, menstruationDay?: number): { items: Array<{ icon: React.ReactNode; label: string }> } => {
  switch (phase) {
    case CyclePhase.Menstrual:
      // Menstruation happens during follicular phase - show both with day numbers
      // The menstruation day is also the follicular phase day
      // TODO: When backend provides menstruationConfirmed status, conditionally show "Menstruation Day" vs "Predicted Menstruation Day"
      return {
        items: [
          {
            icon: <Sprout className="h-4 w-4" />,
            label: menstruationDay ? `Follicular Phase Day ${menstruationDay}` : 'Follicular Phase'
          },
          {
            icon: <Snowflake className="h-4 w-4" />,
            label: menstruationDay ? `Predicted Menstruation Day ${menstruationDay}` : 'Predicted Menstruation'
          }
        ]
      }
    case CyclePhase.Follicular:
      // Just follicular phase, no special event
      // TODO: Add follicular phase day number when backend provides it
      return {
        items: [
          {
            icon: <Sprout className="h-4 w-4" />,
            label: 'Follicular Phase'
          }
        ]
      }
    case CyclePhase.Ovulatory:
      // Ovulation happens at the end of follicular phase - show both
      return {
        items: [
          {
            icon: <Sprout className="h-4 w-4" />,
            label: 'Follicular Phase'
          },
          {
            icon: <Sun className="h-4 w-4" />,
            label: 'Predicted Ovulation Day'
          }
        ]
      }
    case CyclePhase.Luteal:
      // Luteal phase
      // TODO: Add luteal phase day number when backend provides it
      return {
        items: [
          {
            icon: <Leaf className="h-4 w-4" />,
            label: 'Luteal Phase'
          }
        ]
      }
    default:
      return {
        items: [
          {
            icon: <Calendar className="h-4 w-4" />,
            label: 'Unknown Phase'
          }
        ]
      }
  }
}

export function WorkoutSessionCard(props: WorkoutSessionCardProps) {
  const [isCompleteDialogOpen, setIsCompleteDialogOpen] = useState(false)
  const [isSkipping, setIsSkipping] = useState(false)
  const [localSession, setLocalSession] = useState(props.session)
  const toast = useToast()

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

  // Build cycle phases from session
  const cyclePhases = isSessionMode && localSession!.cyclePhase !== undefined
    ? (() => {
        const phaseInfo = getPhaseDisplayInfo(localSession!.cyclePhase, localSession!.menstruationDay)
        return phaseInfo.items.map(item => ({
          phaseName: item.label,
          icon: item.icon
        }))
      })()
    : props.cyclePhases

  // Parse session description into workout content
  const sessionContent: SessionContentProps = isSessionMode
    ? {
        heading: 'Session Instructions',
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

      // Show toast if plan adaptation was triggered
      if (response.recalculationTriggered) {
        toast.info(
          "Training Plan Adapting",
          "We're adjusting your upcoming workouts based on your recent training. This usually takes 1-2 minutes."
        )
      }

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

    // Show toast if plan adaptation was triggered
    if (response.recalculationTriggered) {
      toast.info(
        "Training Plan Adapting",
        "We're adjusting your upcoming workouts based on your recent training. This usually takes 1-2 minutes."
      )
    }

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
  // Format date for display with Today/Tomorrow prefix
  const sessionDate = isSessionMode && localSession ? new Date(localSession.scheduledDate) : new Date()
  const dayOfWeek = sessionDate.toLocaleDateString('en-US', { weekday: 'short' })
  const monthDay = sessionDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

  // Check if date is today or tomorrow
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  const sessionDateOnly = new Date(sessionDate)
  sessionDateOnly.setHours(0, 0, 0, 0)

  let dateString = `${dayOfWeek} ${monthDay}`
  if (sessionDateOnly.getTime() === today.getTime()) {
    dateString = `Today, ${dayOfWeek} ${monthDay}`
  } else if (sessionDateOnly.getTime() === tomorrow.getTime()) {
    dateString = `Tomorrow, ${dayOfWeek} ${monthDay}`
  }


  // Build session progress text
  const progressText = isSessionMode && localSession?.sessionNumberInPhase && localSession?.totalSessionsInPhase
    ? `Session ${localSession.sessionNumberInPhase}/${localSession.totalSessionsInPhase} This Phase`
    : sessionProgress

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
      {progressText || stageInfo || isSessionMode ? (
        <div className="bg-[#fefdfb] border border-[#ebe8e2] rounded-t-lg px-2 pt-1 pb-3 flex items-center gap-3 flex-wrap mb-[-12px] w-fit">
          {/* Date - first element */}
          {isSessionMode && (
            <div className="flex items-center gap-2 text-xs text-[#696863] font-normal">
              <Calendar className="h-4 w-4" />
              <p className="leading-[20px]">{dateString}</p>
            </div>
          )}

          {/* Training stage badge with info popover */}
          {stageInfo && (
            <>
              {isSessionMode && (
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
          (progressText || stageInfo || isSessionMode)
            ? 'rounded-tl-none rounded-tr-2xl rounded-b-2xl'
            : 'rounded-2xl'
        )}
      >
        <CardContent className="p-4">
          {/* Header with session name, metrics, and phase box side by side */}
          <div className="flex gap-4 items-start mb-4">
            {/* Session name and metrics */}
            <div className="flex-1 flex flex-col gap-2">
              <div className="flex justify-between items-start gap-4">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-2xl font-normal text-[#3d3826] font-[family-name:'Petrona']">
                    {sessionName}
                  </h2>
                  {props.session?.isRecentlyUpdated && (
                    <Badge variant="outline" className="bg-blue-50 border-blue-200 text-blue-700 text-xs flex items-center gap-1">
                      <Sparkles className="h-3 w-3" />
                      Recently Updated
                    </Badge>
                  )}
                </div>
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

              {/* Metrics badges - only show for non-rest days */}
              {!isRestDay && (
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
                  {/* Intensity hearts display */}
                  {(isSessionMode ? localSession?.intensityLevel : props.intensityLevel) !== undefined && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-normal text-[#696863]">Intensity</span>
                      <div className="flex gap-1 items-center">
                        {[...Array(3)].map((_, i) => {
                          const level = isSessionMode ? localSession!.intensityLevel : props.intensityLevel!
                          const heartCount = level === IntensityLevel.Low ? 1 : level === IntensityLevel.Moderate ? 2 : 3
                          const heartColor = 'rgb(161, 65, 57)' // #A14139
                          return (
                            <Heart
                              key={i}
                              className="h-4 w-4"
                              fill={i < heartCount ? heartColor : 'none'}
                              stroke={heartColor}
                              strokeWidth={2}
                            />
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Phase box - show cycle phase with guidance */}
            {!isRestDay && (cyclePhases || phaseGuidance || progressText) && (
              <div className="p-4 bg-[#fdfbf7] border border-[#ebe8e2] rounded-lg flex-shrink-0">
              <div className={`flex items-center gap-2 ${phaseGuidance ? 'mb-2' : ''}`}>
                {cyclePhases && cyclePhases.map((phase, index) => (
                  <React.Fragment key={index}>
                    {index > 0 && (
                      <Separator orientation="vertical" className="h-4 bg-[#ebe8e2]" />
                    )}
                    <span className="text-foreground flex items-center h-4">
                      {phase.icon || <Calendar className="h-4 w-4" />}
                    </span>
                    <span className="text-sm font-semibold text-foreground flex items-center h-4">
                      {phase.phaseName}
                    </span>
                  </React.Fragment>
                ))}
                {progressText && (
                  <>
                    {cyclePhases && cyclePhases.length > 0 && (
                      <Separator orientation="vertical" className="h-4 bg-[#ebe8e2]" />
                    )}
                    <span className="text-sm text-[#696863] flex items-center h-4">
                      {progressText}
                    </span>
                  </>
                )}
              </div>
              {phaseGuidance && (
                <p className="text-sm text-[#85837d] leading-relaxed">
                  {phaseGuidance}
                </p>
              )}
            </div>
          )}
          </div>

          {/* Tabs for Warmup/Session/Recover - Only show for non-rest days */}
          {!isRestDay && (
            <Tabs defaultValue="session" className="w-full">
              <TabsList className="w-full bg-[#f3f0e7] p-[3px] h-auto rounded-[10px] mb-4">
                {warmupContent && (
                  <TabsTrigger
                    value="warmup"
                    className="flex-1 text-[#3d3826] text-sm font-medium rounded-[10px] py-1"
                  >
                    Warmup
                  </TabsTrigger>
                )}
                <TabsTrigger
                  value="session"
                  className="flex-1 text-[#3d3826] text-sm font-medium rounded-[10px] py-1"
                >
                  Session
                </TabsTrigger>
                {recoverContent && (
                  <TabsTrigger
                    value="recover"
                    className="flex-1 text-[#3d3826] text-sm font-medium rounded-[10px] py-1"
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
                  {/* Show workout tips at the top if available */}
                  {allTips.length > 0 && (
                    <div className="mb-6">
                      <h3 className="text-sm font-medium text-[#3d3826] mb-3">
                        Training Tips
                      </h3>
                      <ul className="space-y-2">
                        {allTips.map((tip, index) => (
                          <li
                            key={index}
                            className="text-sm text-[#85837d] leading-relaxed list-disc ml-5"
                          >
                            {tip}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Always show stepper format for session steps */}
                  {sessionContent.steps.length > 0 && (
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
                                  <h4 className="text-base font-normal text-foreground">
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
          )}

          {/* Completion status and action buttons (only in session mode) */}
          {isSessionMode && localSession && (
            <div className="mt-6 space-y-4">
              {/* Completion status - hide for rest days */}
              {!isRestDay && localSession.isCompleted && (
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

              {!isRestDay && localSession.isSkipped && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <p className="text-sm font-medium text-gray-800">Skipped</p>
                </div>
              )}


              {/* Action buttons */}
              {isRestDay ? (
                /* Rest day: completed by default. Only offer optional workout log
                   if the user hasn't already logged one. */
                localSession.isCompleted && !localSession.actualDistance && !localSession.actualDuration && (
                  <Button size="sm" variant="outline" onClick={() => setIsCompleteDialogOpen(true)} className="w-full text-foreground">
                    Log Optional Session
                  </Button>
                )
              ) : (
                /* Regular workout day: full action set */
                !localSession.isCompleted && !localSession.isSkipped && (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleSkip}
                      disabled={isSkipping}
                      className="flex-1"
                    >
                      {isSkipping ? 'Skipping...' : 'Skip Session'}
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => setIsCompleteDialogOpen(true)}
                      className="flex-1"
                    >
                      Complete Session
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
                  <h4 className="text-base font-normal text-foreground">{step.title}</h4>
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
