import * as React from 'react'
import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion'
import { Route, Timer, Activity, MoreVertical, Calendar, Snowflake, Sun, Leaf, Sprout, Sparkles, Heart, Ban, Check, AlertCircle } from 'lucide-react'
import { displayDistance, rpeToIntensityLevel } from '@/lib/utils'
import type { SessionDetailDto, CyclePhaseTipsDto, SessionCompletionResponse, TrainingStageInfoDto, CompleteSessionRequest, RecalculationPreviewDto } from '@/types/api'
import { CyclePhase, WorkoutType, IntensityLevel } from '@/types/api'
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover'
import { TRAINING_STAGES } from '@/lib/trainingStages'
import { CompleteSessionDialog } from './CompleteSessionDialog'
import { RecalculationConfirmationModal } from './RecalculationConfirmationModal'
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
  pendingConfirmation?: boolean
  recalculationPreview?: RecalculationPreviewDto

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

// Helper function to get zone and RPE strings based on intensity level
const getZoneAndRPE = (intensityLevel?: IntensityLevel): { zone: string; rpe: string } => {
  switch (intensityLevel) {
    case IntensityLevel.Low:
      return { zone: 'Zone 1-2', rpe: 'RPE 2-4' }
    case IntensityLevel.Moderate:
      return { zone: 'Zone 3-4', rpe: 'RPE 5-7' }
    case IntensityLevel.High:
      return { zone: 'Zone 4-5', rpe: 'RPE 7-9' }
    default:
      return { zone: '', rpe: '' }
  }
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
  const [showRecalculationModal, setShowRecalculationModal] = useState(false)
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

  // Derive zone and RPE from intensity level when in session mode
  const derivedZoneRpe = React.useMemo(() => {
    if (isSessionMode && localSession?.intensityLevel !== undefined) {
      return getZoneAndRPE(localSession.intensityLevel)
    }
    return { zone: '', rpe: '' }
  }, [isSessionMode, localSession?.intensityLevel])

  const zone = props.zone || derivedZoneRpe.zone
  const rpe = derivedZoneRpe.rpe

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

      // Show confirmation modal if user needs to approve recalculation
      if (response.pendingConfirmation) {
        setShowRecalculationModal(true)
      } else if (response.recalculationTriggered) {
        // Only show automatic toast if recalculation was triggered WITHOUT confirmation
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

    // Show confirmation modal if user needs to approve recalculation
    if (response.pendingConfirmation) {
      setShowRecalculationModal(true)
    } else if (response.recalculationTriggered) {
      // Only show automatic toast if recalculation was triggered WITHOUT confirmation
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

  const handleRecalculationConfirmed = () => {
    // User confirmed - show toast and trigger parent refresh to start polling
    toast.info(
      "Training Plan Adapting",
      "We're adjusting your upcoming workouts based on your recent training. This usually takes 1-2 minutes."
    )
    props.onSessionUpdated?.() // Refresh dashboard to start polling
  }

  const handleRecalculationDeclined = () => {
    // User declined - show confirmation toast
    toast.success(
      "Plan Unchanged",
      "Got it! We'll keep your current plan as-is."
    )
    props.onSessionUpdated?.() // Refresh to clear pending state
  }

  // Format date for display with Today/Tomorrow prefix
  const sessionDate = isSessionMode && localSession ? new Date(localSession.scheduledDate) : new Date()
  const dayOfWeek = sessionDate.toLocaleDateString('en-US', { weekday: 'short' })
  const monthShort = sessionDate.toLocaleDateString('en-US', { month: 'short' })
  const dayNumber = sessionDate.getDate()

  // Check if date is today (for accordion default state)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const sessionDateOnly = new Date(sessionDate)
  sessionDateOnly.setHours(0, 0, 0, 0)
  const isToday = sessionDateOnly.getTime() === today.getTime()

  // Determine whether to show planned or actual values
  const showActualValues = localSession?.isCompleted && !isRestDay
  const displayDistanceValue = showActualValues && localSession?.actualDistance
    ? displayDistance(localSession.actualDistance, distanceUnit)
    : distance
  const displayDurationValue = showActualValues && localSession?.actualDuration
    ? localSession.actualDuration
    : durationMinutes
  const displayIntensityLevel = showActualValues && localSession?.rpe
    ? rpeToIntensityLevel(localSession.rpe)
    : (isSessionMode ? localSession?.intensityLevel : props.intensityLevel)

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
      const nutritionTips = Array.isArray(props.cyclePhaseTips.nutritionTips)
        ? props.cyclePhaseTips.nutritionTips
        : []
      const restTips = Array.isArray(props.cyclePhaseTips.restTips)
        ? props.cyclePhaseTips.restTips
        : []

      if (nutritionTips.length > 0) {
        tips.push(...nutritionTips.slice(0, 1)) // Take first nutrition tip
      }
      if (restTips.length > 0) {
        tips.push(...restTips.slice(0, 1)) // Take first rest tip
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
      {/* Main card */}
      <Card className="bg-card border-[#ebe8e2] shadow-[4px_4px_0px_0px_#f3f0e7] rounded-lg">
        <CardContent className="p-4">
          <div className="flex gap-4">
            {/* Date Column - vertically centered */}
            {isSessionMode && (
              <div className="flex flex-col items-center justify-center min-w-[60px] pr-4 border-r border-[#ebe8e2]">
                {/* Phase icons */}
                {cyclePhases && cyclePhases.length > 0 && (
                  <div className="flex items-center gap-1 mb-2">
                    {cyclePhases.map((phase, index) => (
                      <span key={index} className="text-foreground [&>svg]:w-5 [&>svg]:h-5">
                        {phase.icon || <Calendar className="h-5 w-5" />}
                      </span>
                    ))}
                  </div>
                )}
                <span className="text-xs text-muted-foreground font-normal whitespace-nowrap mb-1">
                  {dayOfWeek} {monthShort}
                </span>
                <span className="text-2xl font-normal text-foreground font-petrona">
                  {dayNumber}
                </span>
              </div>
            )}

            {/* Main content */}
            <div className="flex-1">
              {/* Header with session name, metrics, and phase box side by side */}
              <div className="flex flex-wrap gap-4 items-start mb-4">
                {/* Session name and metrics */}
                <div className="flex-1 min-w-[300px] flex flex-col gap-2">
              <div className="flex justify-between items-center gap-4">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-xl font-normal text-[#3d3826] font-[family-name:'Petrona']">
                    {sessionName}
                  </h2>
                  {props.session?.isRecentlyUpdated && (
                    <Badge variant="outline" className="bg-blue-50 border-blue-200 text-blue-700 text-xs flex items-center gap-1 rounded-md">
                      <Sparkles className="h-3 w-3" />
                      Recently Updated
                    </Badge>
                  )}
                  {props.pendingConfirmation && (
                    <Badge
                      variant="outline"
                      className="bg-orange-50 border-orange-200 text-orange-700 text-xs flex items-center gap-1 cursor-pointer hover:bg-orange-100 transition-colors"
                      onClick={() => setShowRecalculationModal(true)}
                    >
                      <AlertCircle className="h-3 w-3" />
                      Needs Attention
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {/* Training stage badge with info popover */}
                  {stageInfo && (
                    <Popover>
                      <PopoverTrigger asChild>
                        <p className="text-xs text-[#696863] font-normal cursor-pointer hover:text-[#3d3826] transition-colors leading-[20px] underline decoration-[#c5c2b8]">
                          {stageInfo.name} Stage
                        </p>
                      </PopoverTrigger>
                      <PopoverContent className="w-72 bg-[#fcf9f3] border-[#ebe8e2]" align="end">
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
                  )}
                  {props.onMenuClick && (
                    <button
                      onClick={props.onMenuClick}
                      className="text-[#3d3826] hover:bg-[#f3f0e7] rounded-md p-1 transition-colors"
                      aria-label="More options"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Metrics badges - only show for non-rest days */}
              {!isRestDay && (
                <div className="flex gap-2 flex-wrap">
                  {displayDistanceValue && (
                    <Badge
                      variant="outline"
                      className="bg-white border-[#ebe8e2] text-[#696863] text-xs font-normal rounded-md"
                    >
                      <Route className="h-3.5 w-3.5 mr-1.5" />
                      {displayDistanceValue} {distanceUnit === 'mi' ? 'mi' : 'km'}
                    </Badge>
                  )}
                  {displayDurationValue && (
                    <Badge
                      variant="outline"
                      className="bg-white border-[#ebe8e2] text-[#696863] text-xs font-normal rounded-md"
                    >
                      <Timer className="h-3.5 w-3.5 mr-1.5" />
                      {displayDurationValue} Min
                    </Badge>
                  )}
                  {(zone || rpe) && (
                    <Badge
                      variant="outline"
                      className="bg-white border-[#ebe8e2] text-[#696863] text-xs font-normal rounded-md"
                    >
                      <Activity className="h-3.5 w-3.5 mr-1.5" />
                      {zone && rpe ? `${zone} / ${rpe}` : zone || rpe}
                    </Badge>
                  )}
                  {/* Intensity hearts display */}
                  {displayIntensityLevel !== undefined && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-normal text-[#696863]">Intensity</span>
                      <div className="flex gap-1 items-center">
                        {[...Array(3)].map((_, i) => {
                          const heartCount = displayIntensityLevel === IntensityLevel.Low ? 1
                            : displayIntensityLevel === IntensityLevel.Moderate ? 2 : 3
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

          </div>

          {/* Combined accordion for Phase Details and Session Details/Summary */}
          {!isRestDay && (
            <Accordion
              type="single"
              collapsible
              defaultValue={isToday ? (localSession?.isCompleted ? "session-summary" : "session-details") : undefined}
              className="w-full mt-4 space-y-2"
            >
              {/* Phase Details */}
              {(cyclePhases || phaseGuidance || progressText) && (
                <AccordionItem value="phase-info" className="border-none">
                  <div className="bg-[#f3f0e7] rounded-md hover:bg-[#EEEBDE] transition-colors">
                    <AccordionTrigger className="px-4 py-3 hover:no-underline border-none hover:bg-transparent rounded-md">
                      <span className="text-base font-normal text-foreground font-[family-name:'Petrona']">Phase Details</span>
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pb-4 pt-0">
                      {/* Phase icons and names */}
                      <div className="flex items-center gap-2 mb-3">
                        {cyclePhases && cyclePhases.map((phase, index) => (
                          <React.Fragment key={index}>
                            {index > 0 && (
                              <Separator orientation="vertical" className="h-4 bg-[#ebe8e2]" />
                            )}
                            <span className="text-foreground flex items-center h-4">
                              {phase.icon || <Calendar className="h-4 w-4" />}
                            </span>
                            <span className="text-sm font-normal text-foreground flex items-center h-4">
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
                      {/* Phase guidance */}
                      {phaseGuidance && (
                        <p className="text-sm text-[#85837d] leading-relaxed">
                          {phaseGuidance}
                        </p>
                      )}
                    </AccordionContent>
                  </div>
                </AccordionItem>
              )}

              {/* Session Summary for completed sessions */}
              {localSession?.isCompleted && (
                <AccordionItem value="session-summary" className="border-none">
                  <div className="bg-[#f3f0e7] rounded-md hover:bg-[#EEEBDE] transition-colors">
                    <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-transparent rounded-md">
                      <span className="text-lg font-normal text-foreground font-[family-name:'Petrona']">Session Summary</span>
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pb-4 pt-0">
                      {/* Actual metrics */}
                      <div className="space-y-2">
                        {localSession.actualDistance && (
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-[#85837d]">Distance</span>
                            <span className="text-sm font-medium text-[#3d3826]">
                              {displayDistance(localSession.actualDistance, distanceUnit)} {distanceUnit}
                            </span>
                          </div>
                        )}
                        {localSession.actualDuration && (
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-[#85837d]">Duration</span>
                            <span className="text-sm font-medium text-[#3d3826]">
                              {localSession.actualDuration} min
                            </span>
                          </div>
                        )}
                        {localSession.rpe && (
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-[#85837d]">RPE</span>
                            <span className="text-sm font-medium text-[#3d3826]">
                              {localSession.rpe}/10
                            </span>
                          </div>
                        )}
                      </div>

                      {/* User notes */}
                      {localSession.userNotes && (
                        <div className="pt-2 border-t border-[#ebe8e2] mt-4">
                          <p className="text-xs font-medium text-[#3d3826] mb-1">Notes</p>
                          <p className="text-sm text-[#85837d] leading-relaxed whitespace-pre-line">
                            {localSession.userNotes}
                          </p>
                        </div>
                      )}
                    </AccordionContent>
                  </div>
                </AccordionItem>
              )}

              {/* Session Details for non-completed sessions */}
              {!localSession?.isCompleted && (
                <AccordionItem value="session-details" className="border-none">
                  <div className="bg-[#f3f0e7] rounded-md hover:bg-[#EEEBDE] transition-colors">
                    <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-transparent rounded-md">
                      <span className="text-base font-normal text-foreground font-[family-name:'Petrona']">Session Details</span>
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pb-4 pt-0">
                      <Tabs defaultValue="session" className="w-full">
                        <TabsList className="w-full bg-[#fcf9f3] p-1 h-auto rounded-md mb-4">
                          {warmupContent && (
                            <TabsTrigger
                              value="warmup"
                              className="flex-1 text-foreground text-sm font-normal rounded-md px-3 py-2 transition-all duration-300 ease-in-out data-[state=active]:bg-muted data-[state=active]:shadow-sm"
                            >
                              Warmup
                            </TabsTrigger>
                          )}
                          <TabsTrigger
                            value="session"
                            className="flex-1 text-foreground text-sm font-normal rounded-md px-3 py-2 transition-all duration-300 ease-in-out data-[state=active]:bg-muted data-[state=active]:shadow-sm"
                          >
                            Session
                          </TabsTrigger>
                          {recoverContent && (
                            <TabsTrigger
                              value="recover"
                              className="flex-1 text-foreground text-sm font-normal rounded-md px-3 py-2 transition-all duration-300 ease-in-out data-[state=active]:bg-muted data-[state=active]:shadow-sm"
                            >
                              Recover
                            </TabsTrigger>
                          )}
                        </TabsList>

                        {warmupContent && (
                          <TabsContent value="warmup" className="mt-0">
                            <div className="rounded-md p-4">
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
                          <div className="rounded-md p-4">
                            {/* Session Instructions */}
                            {sessionContent.steps.length > 0 && (
                              <div className={allTips.length > 0 ? 'mb-6' : ''}>
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
                                                className="bg-white border-[#ebe8e2] text-[#696863] text-xs font-normal rounded-md"
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
                              </div>
                            )}

                            {/* Training Tips */}
                            {allTips.length > 0 && (
                              <div>
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
                          </div>
                        </TabsContent>

                        {recoverContent && (
                          <TabsContent value="recover" className="mt-0">
                            <div className="rounded-md p-4">{recoverContent}</div>
                          </TabsContent>
                        )}
                      </Tabs>
                    </AccordionContent>
                  </div>
                </AccordionItem>
              )}
            </Accordion>
          )}

          {/* Action buttons (only in session mode) */}
          {isSessionMode && localSession && (
            <div className="mt-4 space-y-4">
              {/* Action buttons */}
              {isRestDay ? (
                /* Rest day: completed by default. Only offer optional workout log
                   if the user hasn't already logged one. */
                localSession.isCompleted && !localSession.actualDistance && !localSession.actualDuration && (
                  <Button size="sm" variant="outline" onClick={() => setIsCompleteDialogOpen(true)} className="w-full text-foreground">
                    Log Optional Session
                  </Button>
                )
              ) : localSession.isCompleted ? (
                /* Completed workout: show disabled success button */
                <Button
                  size="sm"
                  disabled
                  className="w-full bg-[#677344] hover:bg-[#677344] text-white cursor-default opacity-100"
                >
                  <Check className="h-4 w-4 mr-2" />
                  Session Completed
                </Button>
              ) : localSession.isSkipped ? (
                /* Skipped workout: show disabled button */
                <Button
                  size="sm"
                  disabled
                  variant="outline"
                  className="w-full cursor-default opacity-100 text-foreground"
                >
                  <Ban className="h-4 w-4 mr-2" />
                  Session Skipped
                </Button>
              ) : (
                /* Regular workout day: full action set */
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleSkip}
                    disabled={isSkipping}
                    className="flex-1 text-foreground"
                  >
                    <Ban className="h-4 w-4 mr-2" />
                    {isSkipping ? 'Skipping...' : 'Skip Session'}
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => setIsCompleteDialogOpen(true)}
                    className="flex-1"
                  >
                    <Check className="h-4 w-4 mr-2" />
                    Complete Session
                  </Button>
                </div>
              )}
            </div>
          )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Complete Session Dialog - only mount when open to avoid audio API initialization on page load */}
      {isSessionMode && localSession && isCompleteDialogOpen && (
        <CompleteSessionDialog
          session={localSession}
          open={isCompleteDialogOpen}
          onOpenChange={setIsCompleteDialogOpen}
          onComplete={handleComplete}
          distanceUnit={distanceUnit}
          startInLogMode={isRestDay}
        />
      )}

      {/* Recalculation Confirmation Modal */}
      {isSessionMode && (
        <RecalculationConfirmationModal
          open={showRecalculationModal}
          onOpenChange={setShowRecalculationModal}
          onConfirmed={handleRecalculationConfirmed}
          onDeclined={handleRecalculationDeclined}
          preview={props.recalculationPreview}
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
