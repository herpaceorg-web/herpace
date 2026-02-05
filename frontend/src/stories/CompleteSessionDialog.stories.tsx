import type { Meta, StoryObj } from '@storybook/react-vite'
import { CompleteSessionDialog } from '@/components/session/CompleteSessionDialog'
import { WorkoutType, IntensityLevel, CyclePhase } from '@/types/api'
import type { SessionDetailDto } from '@/types/api'
import { useState } from 'react'
import { Button } from '@/components/ui/button'

const meta = {
  title: 'Components/Session/CompleteSessionDialog',
  component: CompleteSessionDialog,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof CompleteSessionDialog>

export default meta
type Story = StoryObj<typeof meta>

// Mock session data
const mockSession: SessionDetailDto = {
  id: '1',
  sessionName: '30 Minute Easy Run',
  workoutType: WorkoutType.Easy,
  scheduledDate: new Date().toISOString(),
  distance: 5,
  durationMinutes: 30,
  intensityLevel: IntensityLevel.Low,
  cyclePhase: CyclePhase.Follicular,
  isCompleted: false,
  isSkipped: false,
  sessionNumberInPhase: 5,
  totalSessionsInPhase: 15,
  workoutTips: [
    'Focus on maintaining an easy, conversational pace',
    'Keep your heart rate in Zone 2 for optimal aerobic development',
  ]
}

const mockLongRunSession: SessionDetailDto = {
  id: '2',
  sessionName: 'Long Run with Tempo Finish',
  workoutType: WorkoutType.Long,
  scheduledDate: new Date().toISOString(),
  distance: 15,
  durationMinutes: 90,
  intensityLevel: IntensityLevel.Moderate,
  cyclePhase: CyclePhase.Luteal,
  isCompleted: false,
  isSkipped: false,
  sessionNumberInPhase: 12,
  totalSessionsInPhase: 15,
}

const mockRestDaySession: SessionDetailDto = {
  id: '3',
  sessionName: 'Rest Day',
  workoutType: WorkoutType.Rest,
  scheduledDate: new Date().toISOString(),
  distance: undefined,
  durationMinutes: undefined,
  intensityLevel: undefined,
  cyclePhase: CyclePhase.Menstrual,
  isCompleted: true,
  isSkipped: false,
  sessionNumberInPhase: 1,
  totalSessionsInPhase: 8,
}

// Wrapper component to handle dialog state
function DialogWrapper({ session, distanceUnit = 'km', startInLogMode = false }: {
  session: SessionDetailDto
  distanceUnit?: 'km' | 'mi'
  startInLogMode?: boolean
}) {
  const [open, setOpen] = useState(true)

  return (
    <div>
      <Button onClick={() => setOpen(true)}>Open Dialog</Button>
      <CompleteSessionDialog
        session={session}
        open={open}
        onOpenChange={setOpen}
        onComplete={async (data) => {
          console.log('Session completed with data:', data)
          alert('Session completed! Check console for details.')
        }}
        distanceUnit={distanceUnit}
        startInLogMode={startInLogMode}
      />
    </div>
  )
}

export const EasyRun: Story = {
  render: () => <DialogWrapper session={mockSession} distanceUnit="km" />,
}

export const LongRun: Story = {
  render: () => <DialogWrapper session={mockLongRunSession} distanceUnit="km" />,
}

export const RestDay: Story = {
  render: () => <DialogWrapper session={mockRestDaySession} distanceUnit="km" />,
}

export const WithMiles: Story = {
  render: () => <DialogWrapper session={mockSession} distanceUnit="mi" />,
}

// Design mockup showing integrated voice feature
export const IntegratedVoiceDesign: Story = {
  parameters: {
    layout: 'padded',
  },
  render: () => (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h2 className="text-2xl font-semibold mb-4">State 1: Initial - Choose Input Method</h2>
        <p className="text-sm text-muted-foreground mb-6">
          Users can choose to manually enter data OR chat about their training session
        </p>

        <div className="bg-card border border-border rounded-lg p-6 max-w-[500px] shadow-lg">
          <div className="space-y-6">
            {/* Header */}
            <div>
              <h3 className="font-petrona text-2xl font-normal text-foreground mb-1">Complete Training Session</h3>
              <p className="text-sm font-normal text-[#696863]">How did your 30 Minute Easy Run go?</p>
            </div>

            {/* Voice Option - Prominent centered placement */}
            <div className="bg-muted rounded-lg p-6">
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full bg-rose-500 hover:bg-rose-600 flex items-center justify-center cursor-pointer transition-colors mb-4">
                  <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                </div>
                <h4 className="text-sm font-normal text-foreground mb-1">Chat about your training session</h4>
                <p className="text-sm font-normal text-[#696863]">
                  Tell me how it went and I'll log the details for you
                </p>
              </div>
            </div>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-card text-[#696863] font-normal">or enter manually</span>
              </div>
            </div>

            {/* Manual Form Fields */}
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-normal text-foreground">Distance (km)</label>
                <input
                  type="number"
                  className="w-full px-3 py-2 border border-input rounded-md bg-background"
                  placeholder="5.0"
                />
                <p className="text-xs text-[#696863]">Planned: 5 km</p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-normal text-foreground">Duration (minutes)</label>
                <input
                  type="number"
                  className="w-full px-3 py-2 border border-input rounded-md bg-background"
                  placeholder="30"
                />
                <p className="text-xs text-[#696863]">Planned: 30 min</p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-normal text-foreground">How did the training session feel? (RPE 1-10)</label>
                <input
                  type="number"
                  className="w-full px-3 py-2 border border-input rounded-md bg-background"
                  placeholder="1 (very easy) - 10 (maximum effort)"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-normal text-foreground">Notes (optional)</label>
                <textarea
                  className="w-full px-3 py-2 border border-input rounded-md bg-background min-h-[80px]"
                  placeholder="How did you feel? Any issues or observations?"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-4">
              <button className="flex-1 px-4 py-2 border border-input rounded-md hover:bg-muted font-normal">
                Cancel
              </button>
              <button className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 font-normal">
                Save Training Session
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* State 2: Recording Active */}
      <div>
        <h2 className="text-2xl font-semibold mb-4">State 2: Recording Active</h2>
        <p className="text-sm text-muted-foreground mb-6">
          User tapped the microphone - now recording. Bars animate when user speaks, stay still when silent.
        </p>

        <div className="bg-card border border-border rounded-lg p-6 max-w-[500px] shadow-lg">
          <div className="space-y-6">
            {/* Header */}
            <div>
              <h3 className="font-petrona text-2xl font-normal text-foreground mb-1">Complete Training Session</h3>
              <p className="text-sm font-normal text-[#696863]">30 Minute Easy Run</p>
            </div>

            {/* Active Recording State */}
            <div className="bg-muted rounded-lg p-6">
              <div className="flex flex-col items-center text-center">
                <div className="relative mb-4">
                  <div className="w-16 h-16 rounded-full bg-rose-500 flex items-center justify-center animate-pulse cursor-pointer">
                    <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                    </svg>
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                    <div className="w-2.5 h-2.5 bg-white rounded-full animate-pulse"></div>
                  </div>
                </div>
                <h4 className="text-sm font-normal text-foreground mb-1">I'm listening...</h4>
                <p className="text-sm font-normal text-[#696863] mb-4">
                  Tell me about your training session
                </p>

                {/* Animated sound bars - animate when user speaks, still when silent */}
                <div className="flex gap-1 mb-4">
                  {[12, 18, 24, 16, 20].map((height, i) => (
                    <div
                      key={i}
                      className="w-1.5 bg-rose-500 rounded-full animate-pulse"
                      style={{ height: `${height}px` }}
                    />
                  ))}
                </div>

                <div className="bg-card/80 rounded-lg p-3 mb-4 text-left w-full">
                  <p className="text-sm text-[#696863] font-normal">Transcript:</p>
                  <p className="text-sm text-[#696863] font-normal italic mt-1">
                    "That felt really good today, I managed to do the full 5k in about 28 minutes..."
                  </p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-4">
              <button className="flex-1 px-4 py-2 border border-input rounded-md hover:bg-muted font-normal">
                Cancel
              </button>
              <button className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 font-normal opacity-50" disabled>
                Save Training Session
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* State 3: Recording Ended */}
      <div>
        <h2 className="text-2xl font-semibold mb-4">State 3: Recording Ended</h2>
        <p className="text-sm text-muted-foreground mb-6">
          User stopped recording - ready to process
        </p>

        <div className="bg-card border border-border rounded-lg p-6 max-w-[500px] shadow-lg">
          <div className="space-y-6">
            {/* Header */}
            <div>
              <h3 className="font-petrona text-2xl font-normal text-foreground mb-1">Complete Training Session</h3>
              <p className="text-sm font-normal text-[#696863]">30 Minute Easy Run</p>
            </div>

            {/* Recording Ended State */}
            <div className="bg-muted rounded-lg p-6">
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full bg-rose-500 flex items-center justify-center cursor-pointer mb-4">
                  <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                </div>
                <h4 className="text-sm font-normal text-foreground mb-1">Recording complete</h4>
                <p className="text-sm font-normal text-[#696863] mb-4">
                  Ready to analyze your session
                </p>

                <div className="bg-card/80 rounded-lg p-3 mb-4 text-left w-full">
                  <p className="text-sm text-[#696863] font-normal">Transcript:</p>
                  <p className="text-sm text-[#696863] font-normal mt-1">
                    "That felt really good today, I managed to do the full 5k in about 28 minutes. My legs felt strong throughout and I maintained a good pace. I'd say it was about a 7 out of 10 in terms of effort."
                  </p>
                </div>

                <button className="w-full px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-md font-normal transition-colors">
                  Analyze Session
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-4">
              <button className="flex-1 px-4 py-2 border border-input rounded-md hover:bg-muted font-normal">
                Cancel
              </button>
              <button className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 font-normal opacity-50" disabled>
                Save Training Session
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* State 4: Processing */}
      <div>
        <h2 className="text-2xl font-semibold mb-4">State 4: Processing</h2>
        <p className="text-sm text-muted-foreground mb-6">
          AI is analyzing the transcript and extracting data
        </p>

        <div className="bg-card border border-border rounded-lg p-6 max-w-[500px] shadow-lg">
          <div className="space-y-6">
            {/* Header */}
            <div>
              <h3 className="font-petrona text-2xl font-normal text-foreground mb-1">Complete Training Session</h3>
              <p className="text-sm font-normal text-[#696863]">30 Minute Easy Run</p>
            </div>

            {/* Processing State */}
            <div className="bg-muted rounded-lg p-6">
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full bg-blue-500 flex items-center justify-center mb-4 animate-pulse">
                  <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <h4 className="text-sm font-normal text-foreground mb-1">Analyzing your session...</h4>
                <p className="text-sm font-normal text-[#696863]">
                  Extracting distance, duration, and effort details
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-4">
              <button className="flex-1 px-4 py-2 border border-input rounded-md hover:bg-muted font-normal opacity-50" disabled>
                Cancel
              </button>
              <button className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 font-normal opacity-50" disabled>
                Save Training Session
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* State 5: Review & Confirm */}
      <div>
        <h2 className="text-2xl font-semibold mb-4">State 5: Review & Confirm</h2>
        <p className="text-sm text-muted-foreground mb-6">
          AI has extracted data - user can review and confirm
        </p>

        <div className="bg-card border border-border rounded-lg p-6 max-w-[500px] shadow-lg">
          <div className="space-y-6">
            {/* Header */}
            <div>
              <h3 className="font-petrona text-2xl font-normal text-foreground mb-1">Complete Training Session</h3>
              <p className="text-sm font-normal text-[#696863]">30 Minute Easy Run</p>
            </div>

            {/* Extracted Data Review */}
            <div className="bg-muted rounded-lg p-4">
              <div className="flex items-center gap-2 mb-4">
                <svg className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h4 className="text-sm font-normal text-foreground">Review your session details</h4>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-3">
                <div className="bg-card p-3 rounded-md">
                  <div className="text-xs text-[#696863]">Distance</div>
                  <div className="text-lg font-semibold">5.0 km</div>
                </div>
                <div className="bg-card p-3 rounded-md">
                  <div className="text-xs text-[#696863]">Duration</div>
                  <div className="text-lg font-semibold">28 min</div>
                </div>
                <div className="bg-card p-3 rounded-md col-span-2">
                  <div className="text-xs text-[#696863]">Effort (RPE)</div>
                  <div className="text-lg font-semibold">7/10</div>
                </div>
              </div>

              <div className="bg-card p-3 rounded-md">
                <div className="text-xs text-[#696863] mb-1">Notes</div>
                <div className="text-sm text-foreground">Felt strong throughout, maintained good pace. Legs felt great.</div>
              </div>
            </div>

            {/* Manual Form Fields - collapsed/hidden when data extracted */}
            <div className="text-center">
              <button className="text-sm text-[#696863] hover:text-foreground font-normal">
                Edit manually instead
              </button>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-4">
              <button className="flex-1 px-4 py-2 border border-input rounded-md hover:bg-muted font-normal">
                Cancel
              </button>
              <button className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 font-normal">
                Confirm & Save
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  ),
}
