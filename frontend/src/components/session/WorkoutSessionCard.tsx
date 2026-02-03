import * as React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { Route, Timer, Activity, MoreVertical, Calendar } from 'lucide-react'
import { cn } from '@/lib/utils'

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
  sessionName: string
  distance?: number
  distanceUnit?: 'km' | 'mi'
  durationMinutes?: number
  zone?: string
  cyclePhases?: {
    phaseName: string
    icon?: React.ReactNode
  }[]
  sessionProgress?: string
  warmupContent?: React.ReactNode
  sessionContent: SessionContentProps
  recoverContent?: React.ReactNode
  onMenuClick?: () => void
}

export function WorkoutSessionCard({
  sessionName,
  distance,
  distanceUnit = 'mi',
  durationMinutes,
  zone,
  cyclePhases,
  sessionProgress,
  warmupContent,
  sessionContent,
  recoverContent,
  onMenuClick,
}: WorkoutSessionCardProps) {
  return (
    <div className="w-full max-w-[760px]">
      {/* Phase tracking section */}
      {(cyclePhases && cyclePhases.length > 0) || sessionProgress ? (
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
          {sessionProgress && (
            <>
              {cyclePhases && cyclePhases.length > 0 && (
                <Separator orientation="vertical" className="h-7 bg-[#ebe8e2]" />
              )}
              <div className="flex items-center justify-center px-2 py-0.5">
                <p className="text-[#696863] text-xs font-normal leading-[16px]">
                  {sessionProgress}
                </p>
              </div>
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
          <div className="flex justify-between items-start mb-6">
            <div className="flex flex-col gap-2 flex-1">
              <h2 className="text-2xl font-semibold text-[#3d3826] font-[family-name:'Petrona']">
                {sessionName}
              </h2>
              {/* Metrics badges */}
              <div className="flex gap-2 flex-wrap">
                {distance && (
                  <Badge
                    variant="outline"
                    className="bg-white border-[#ebe8e2] text-[#696863] text-xs font-normal"
                  >
                    <Route className="h-3.5 w-3.5 mr-1.5" />
                    {distance} {distanceUnit === 'mi' ? 'Mi' : 'km'}
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
            {onMenuClick && (
              <button
                onClick={onMenuClick}
                className="text-[#3d3826] hover:bg-[#f3f0e7] rounded p-1 transition-colors"
                aria-label="More options"
              >
                <MoreVertical className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Tabs for Warmup/Session/Recover */}
          <Tabs defaultValue={warmupContent ? 'warmup' : 'session'} className="w-full">
            <TabsList className="w-full bg-[#f3f0e7] p-[3px] h-auto rounded-[10px] mb-6">
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
              </div>
            </TabsContent>

            {recoverContent && (
              <TabsContent value="recover" className="mt-0">
                <div className="bg-[#f3f0e7] rounded-lg p-4">{recoverContent}</div>
              </TabsContent>
            )}
          </Tabs>
        </CardContent>
      </Card>
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
                      <Clock className="h-3.5 w-3.5 mr-1.5" />
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
